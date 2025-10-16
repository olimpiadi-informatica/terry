use std::boxed::Box;
use std::collections::{HashMap, HashSet};
use std::os::unix::fs::PermissionsExt;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use async_channel::{Receiver, Sender, unbounded};
use color_eyre::eyre::{Result, WrapErr, bail, eyre};
use sqlx::SqlitePool;
use tokio::fs;
use tokio::io::AsyncWriteExt;
use tokio::process::Command;
use tokio::sync::Mutex;
use tokio::task::JoinHandle;
use tracing::{debug, error, info, instrument, warn};

use crate::config::{self, Config, TEMPORARY_PATH};
use crate::database::{self, get_tasks};
use crate::storage_manager;

/// A pre-generated input, ready for a user.
#[derive(Debug)]
pub struct GeneratedInput {
    pub id: String,
    pub path: PathBuf,
}

/// Holds all runtime information for a task, including DB data and executable paths.
#[derive(Debug)]
pub struct TaskInfo {
    generator_path: PathBuf,
    validator_path: Option<PathBuf>,
    checker_path: PathBuf,
    available_inputs: Vec<GeneratedInput>,
    enqueued_inputs: usize,
    input_is_generated: (Sender<()>, Receiver<()>),
}

impl TaskInfo {
    async fn new(task_name: &str) -> Result<Self> {
        let system_ext = format!(".{}.{}", std::env::consts::OS, std::env::consts::ARCH);
        let task_dir = PathBuf::from(config::CONTEST_PATH).join(&task_name);
        let managers_dir = task_dir.join("managers");

        let generator_path = managers_dir.join(format!("generator{}", system_ext));
        let checker_path = managers_dir.join(format!("checker{}", system_ext));
        let validator_path_candidate = managers_dir.join(format!("validator{}", system_ext));

        let exec = std::fs::Permissions::from_mode(0o755);

        // Set executable permissions
        fs::set_permissions(&generator_path, exec.clone())
            .await
            .wrap_err_with(|| format!("Failed to set permissions on {:?}", generator_path))?;
        fs::set_permissions(&checker_path, exec.clone())
            .await
            .wrap_err_with(|| format!("Failed to set permissions on {:?}", checker_path))?;

        let validator_path = if validator_path_candidate.exists() {
            fs::set_permissions(&validator_path_candidate, exec)
                .await
                .wrap_err_with(|| {
                    format!(
                        "Failed to set permissions on {:?}",
                        validator_path_candidate
                    )
                })?;
            Some(validator_path_candidate)
        } else {
            None
        };

        Ok(TaskInfo {
            generator_path,
            validator_path,
            checker_path,
            available_inputs: vec![],
            enqueued_inputs: 0,
            input_is_generated: unbounded(),
        })
    }
}

/// Manages the contest state, including tasks and the input generation workers.
#[derive(Clone, Debug)]
pub struct ContestManager {
    tasks: Arc<Mutex<HashMap<String, TaskInfo>>>,
    _running_tasks: Arc<Vec<JoinHandle<()>>>,
    task_statement_hashes: Arc<Mutex<HashMap<String, HashSet<Vec<u8>>>>>,
}

impl ContestManager {
    /// Creates a new `ContestManager` and loads the contest tasks from the database.
    pub async fn new(pool: SqlitePool, config: Config) -> Result<Self> {
        let (send, recv) = unbounded();
        let tasks = Arc::new(Mutex::new(HashMap::new()));
        let task_statement_hashes = Arc::new(Mutex::new(HashMap::new())); // Initialized here

        let num_workers = config.num_workers.unwrap_or_else(num_cpus::get);
        info!("Spawning {} input generation workers", num_workers);

        let mut running_tasks = vec![];

        running_tasks.push(tokio::spawn(watcher(
            tasks.clone(),
            pool.clone(),
            send.clone(),
            config,
        )));

        for i in 0..num_workers {
            debug!("Spawning worker {}", i);
            running_tasks.push(tokio::spawn(worker(tasks.clone(), recv.clone())));
        }
        Ok(ContestManager {
            tasks,
            _running_tasks: Arc::new(running_tasks),
            task_statement_hashes,
        })
    }

    /// Fetches a pre-generated input from the queue for a specific task.
    pub async fn get_input(&self, task_name: &str, attempt: u32) -> Result<GeneratedInput> {
        let input = loop {
            let notify = {
                let mut tasks = self.tasks.lock().await;
                if !tasks.contains_key(task_name) {
                    let task_info = TaskInfo::new(task_name).await?;
                    tasks.insert(task_name.to_string(), task_info);
                };
                if let Some(input) = tasks.get_mut(task_name).unwrap().available_inputs.pop() {
                    break input;
                }
                tasks.get(task_name).unwrap().input_is_generated.1.clone()
            };
            warn!("Waiting for generated input for task {}", task_name);
            notify.recv().await?;
        };

        let final_path = storage_manager::new_input_file(&input.id, task_name, attempt).await?;
        storage_manager::rename_file(&input.path, &final_path).await?;
        debug!(
            "Renamed input file from {:?} to {:?}",
            input.path, final_path
        );

        return Ok(GeneratedInput {
            id: input.id,
            path: final_path,
        });
    }

    /// Given an input of a task, evaluate the correctness of the output.
    pub async fn evaluate_output(
        &self,
        task_name: &str,
        input_path: &PathBuf,
        output_path: &PathBuf,
    ) -> Result<Vec<u8>> {
        let mut command = {
            let tasks = self.tasks.lock().await;
            let task_info = tasks
                .get(task_name)
                .ok_or_else(|| eyre!("Task not found: {}", task_name))?;

            let mut command = Command::new(&task_info.checker_path);
            command
                .arg(storage_manager::get_absolute_path(input_path))
                .arg(storage_manager::get_absolute_path(output_path));
            command
        };
        let output = command
            .output()
            .await
            .wrap_err("Failed to execute checker binary")?;

        if !output.status.success() {
            return Err(eyre!(
                "Checker for task {} failed with status {}: {}\nstderr: {}",
                task_name,
                output.status,
                String::from_utf8_lossy(&output.stdout),
                String::from_utf8_lossy(&output.stderr)
            ));
        }

        info!("Evaluated output for task {}", task_name);
        Ok(output.stdout)
    }

    pub async fn is_statement_file(&self, task_name: &str, content: &[u8]) -> Result<bool> {
        let mut task_hashes = self.task_statement_hashes.lock().await;
        if !task_hashes.contains_key(task_name) {
            let statement_dir = PathBuf::from(config::CONTEST_PATH)
                .join(task_name)
                .join("statement");
            let mut hashes = HashSet::new();
            Self::load_task_statement_hashes(&statement_dir, &mut hashes).await?;
            task_hashes.insert(task_name.to_string(), hashes);
        }

        let mut hasher = blake3::Hasher::new();
        hasher.update(content);
        let hash = hasher.finalize().as_bytes().to_vec();
        Ok(task_hashes.get(task_name).unwrap().contains(&hash))
    }

    async fn load_task_statement_hashes(
        statement_dir: &Path,
        hashes: &mut HashSet<Vec<u8>>,
    ) -> Result<()> {
        if !statement_dir.exists() {
            warn!("Statement directory {:?} does not exist.", statement_dir);
            return Ok(());
        }

        let mut entries = fs::read_dir(statement_dir).await?;
        while let Some(entry) = entries.next_entry().await? {
            let path = entry.path();
            if path.is_file() {
                let content = fs::read(&path).await?;
                let mut hasher = blake3::Hasher::new();
                hasher.update(&content);
                let hash = hasher.finalize().as_bytes().to_vec();
                hashes.insert(hash);
            } else if path.is_dir() {
                Box::pin(Self::load_task_statement_hashes(&path, hashes)).await?;
            }
        }
        Ok(())
    }
}

async fn watcher_iteration(
    tasks: &Arc<Mutex<HashMap<String, TaskInfo>>>,
    db: &SqlitePool,
    sender: &Sender<String>,
    config: &Config,
) -> Result<()> {
    let all_tasks = get_tasks(db).await?;
    let mut tasks = tasks.lock().await;
    for task in all_tasks.iter() {
        let task_name = &task.name;
        if !tasks.contains_key(task_name) {
            let task_info = TaskInfo::new(task_name).await?;
            tasks.insert(task_name.to_string(), task_info);
        };
        let task = tasks.get_mut(task_name).unwrap();
        for _ in task.available_inputs.len() + task.enqueued_inputs..config.queue_size {
            info!(
                avail = task.available_inputs.len(),
                enqueued = task.enqueued_inputs,
                needed = config.queue_size,
                "Enqueuing input generation for task {task_name}",
            );
            sender.send(task_name.clone()).await.unwrap();
            task.enqueued_inputs += 1;
        }
    }
    Ok(())
}

async fn watcher(
    tasks: Arc<Mutex<HashMap<String, TaskInfo>>>,
    db: SqlitePool,
    sender: Sender<String>,
    config: Config,
) {
    info!("Watcher task started");
    loop {
        if let Err(e) = watcher_iteration(&tasks, &db, &sender, &config).await {
            error!("{}", e);
        }
        tokio::time::sleep(std::time::Duration::from_secs(1)).await;
    }
}

#[instrument(skip(tasks), ret)]
async fn worker_iteration(
    tasks: &Arc<Mutex<HashMap<String, TaskInfo>>>,
    task_name: &str,
) -> Result<()> {
    let (generator, validator) = {
        let tasks = tasks.lock().await;
        let task_info = tasks
            .get(task_name)
            .ok_or_else(|| eyre!("Worker received job for unknown task: {}", task_name))?;
        (
            task_info.generator_path.clone(),
            task_info.validator_path.clone(),
        )
    };

    let input_id = database::gen_id();
    let temp_path = PathBuf::from(TEMPORARY_PATH).join(format!("{task_name}-{input_id}"));
    let seed = u32::from_le_bytes(input_id.as_bytes()[0..4].try_into().unwrap_or([0; 4]));

    let output = Command::new(&generator)
        .arg(seed.to_string())
        .arg("0")
        .output()
        .await
        .with_context(|| {
            format!("Failed to execute generator for task {task_name} (input {input_id})",)
        })?;

    if !output.status.success() {
        bail!(
            "Generator for task {} failed with status {} on input {input_id}: {}\nstderr: {}",
            task_name,
            output.status,
            String::from_utf8_lossy(&output.stdout),
            String::from_utf8_lossy(&output.stderr)
        );
    }

    if let Some(validator_path) = &validator {
        let mut child = Command::new(validator_path)
            .arg("0")
            .stdin(std::process::Stdio::piped())
            .spawn()
            .with_context(|| {
                format!("Failed to execute validator for task {task_name} (input {input_id})",)
            })?;

        child
            .stdin
            .take()
            .unwrap()
            .write_all(&output.stdout)
            .await
            .with_context(|| format!("Failed to pipe to validator stdin for task {task_name}",))?;

        let status = child
            .wait()
            .await
            .with_context(|| format!("Validator for task {task_name} failed"))?;

        if !status.success() {
            bail!("Validator for task {task_name} failed with status {status}",);
        }
    }

    storage_manager::save_file(&temp_path, &output.stdout)
        .await
        .with_context(|| format!("Failed to save temporary input file for task {task_name}",))?;

    debug!("Generated input {input_id} for task {task_name}",);
    let input = GeneratedInput {
        id: input_id,
        path: temp_path,
    };

    let mut tasks = tasks.lock().await;
    let task_info = tasks.get_mut(task_name).unwrap();
    task_info.enqueued_inputs -= 1;
    task_info.available_inputs.push(input);
    task_info.input_is_generated.0.send(()).await.unwrap();
    Ok(())
}

async fn worker(tasks: Arc<Mutex<HashMap<String, TaskInfo>>>, recv: Receiver<String>) {
    loop {
        let task_name = recv.recv().await.unwrap();
        if let Err(e) = worker_iteration(&tasks, &task_name).await {
            error!("{}", e);
            let mut tasks = tasks.lock().await;
            let task_info = tasks.get_mut(&task_name).unwrap();
            task_info.enqueued_inputs -= 1;
        }
    }
}
