use std::fs;
use std::path::Path;

use color_eyre::eyre::{Result, eyre};
use serde::Deserialize;
use sqlx::SqlitePool;

use crate::config::CONTEST_PATH;
use crate::database;

#[derive(Debug, Deserialize)]
struct TaskConfig {
    name: String,
    description: String,
    max_score: f64,
    submission_timeout: Option<i64>,
}

pub async fn import_task(pool: &SqlitePool, args: &crate::cli::ImportTaskArgs) -> Result<()> {
    let task_folder_path = &args.task_folder;
    if !task_folder_path.is_dir() {
        return Err(eyre!(
            "'{}' is not a directory",
            task_folder_path.to_string_lossy()
        ));
    }

    let task_yaml_path = task_folder_path.join("task.yaml");
    if !task_yaml_path.is_file() {
        return Err(eyre!(
            "'task.yaml' not found in '{}'",
            task_folder_path.to_string_lossy()
        ));
    }

    let task_yaml_content = fs::read_to_string(task_yaml_path)?;
    let task_config: TaskConfig = serde_yaml::from_str(&task_yaml_content)?;

    let tasks_dir = Path::new(CONTEST_PATH);
    fs::create_dir_all(&tasks_dir)?;

    let new_task_path = tasks_dir.join(&task_config.name);
    if new_task_path.exists() {
        return Err(eyre!("Task '{}' already exists", task_config.name));
    }

    fs_extra::dir::copy(
        task_folder_path,
        &tasks_dir,
        &fs_extra::dir::CopyOptions::new(),
    )?;

    let statement_path = new_task_path.join("statement").join("statement.md");
    if !statement_path.is_file() {
        return Err(eyre!(
            "'statement.md' not found in '{}'",
            new_task_path.to_string_lossy()
        ));
    }

    database::shift_tasks(pool, args.num).await?;

    database::add_task(
        pool,
        &task_config.name,
        &task_config.description, // Use description as title
        "statement.md",
        task_config.max_score,
        args.num,
        task_config.submission_timeout,
    )
    .await?;

    println!("Task '{}' imported successfully", task_config.name);

    Ok(())
}

#[cfg(test)]
mod tests {
    use std::path::PathBuf;

    use sqlx::SqlitePool;
    use tempfile::tempdir;

    use super::*;
    use crate::cli::ImportTaskArgs; // Import ImportTaskArgs from cli.rs
    use crate::database;

    async fn setup_db() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("Failed to connect to in-memory database");
        sqlx::migrate!()
            .run(&pool)
            .await
            .expect("Failed to run migrations");
        pool
    }

    fn create_dummy_contest_dir(dir: &Path) {
        // Create contest.yaml
        fs::write(
            dir.join("contest.yaml"),
            r#"
            duration: 18000
            tasks:
                - poldo
            users:
                - token: token
                  name: Test
                  surname: User
            "#,
        )
        .expect("Failed to write contest.yaml");

        // Create poldo/task.yaml
        fs::create_dir_all(dir.join("poldo")).expect("Failed to create poldo dir");
        fs::write(
            dir.join("poldo/task.yaml"),
            r#"
            name: poldo
            description: Poldo
            max_score: 42.0
            "#,
        )
        .expect("Failed to write poldo/task.yaml");

        // Create poldo/statement/statement.md
        fs::create_dir_all(dir.join("poldo/statement"))
            .expect("Failed to create poldo/statement dir");
        fs::write(dir.join("poldo/statement/statement.md"), "# Poldo")
            .expect("Failed to write poldo/statement/statement.md");

        // Create poldo/managers/generator.linux.x86_64
        fs::create_dir_all(dir.join("poldo/managers"))
            .expect("Failed to create poldo/managers dir");
        fs::write(
            dir.join("poldo/managers/generator.linux.x86_64"),
            "#!/usr/bin/bash\necho 42\n",
        )
        .expect("Failed to write generator");

        // Create poldo/managers/validator.linux.x86_64
        fs::write(
            dir.join("poldo/managers/validator.linux.x86_64"),
            "#!/usr/bin/bash\nexit 0\n",
        )
        .expect("Failed to write validator");

        // Create poldo/managers/checker.linux.x86_64
        fs::write(
            dir.join("poldo/managers/checker.linux.x86_64"),
            "#!/usr/bin/bash\necho '{\"validation\":{},\"feedback\":{},\"score\":0.5}'\n",
        )
        .expect("Failed to write checker");
    }

    #[tokio::test]
    async fn test_import_contest() {
        let pool = setup_db().await;

        let temp_test_dir = tempdir().expect("Failed to create temp test dir");
        let original_cwd =
            std::env::current_dir().expect("Failed to get current working directory");
        std::env::set_current_dir(&temp_test_dir).expect("Failed to change working directory");

        let temp_dir = tempdir().expect("Failed to create temp dir");
        create_dummy_contest_dir(temp_dir.path());

        let args = ImportTaskArgs {
            task_folder: temp_dir.path().join("poldo"),
            num: 0,
        };

        import_task(&pool, &args)
            .await
            .expect("Failed to import task");

        // Verify task in database
        let task = database::get_task(&pool, "poldo")
            .await
            .expect("Failed to get task")
            .unwrap();
        assert_eq!(task.name, "poldo");
        assert_eq!(task.title, "Poldo");
        assert_eq!(task.max_score, 42.0);
        assert_eq!(task.num, 0);

        // Verify files are copied (this is harder to test directly, but we can check existence)
        let contest_path = PathBuf::from(crate::config::CONTEST_PATH);
        assert!(contest_path.join("poldo/statement/statement.md").exists());
        assert!(
            contest_path
                .join("poldo/managers/generator.linux.x86_64")
                .exists()
        );

        std::env::set_current_dir(&original_cwd).expect("Failed to restore working directory");
    }
}
