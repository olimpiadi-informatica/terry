use std::collections::HashMap;
use std::os::unix::fs::symlink;
use std::path::Path;

use color_eyre::eyre::Result;
use csv::Writer;
use sqlx::SqlitePool;
use tokio::fs;

use crate::cli::ExportArgs;
use crate::database::submission::get_submissions;
use crate::database::task::get_tasks;
use crate::database::user::get_users;
use crate::models::SubmissionFull;
use crate::storage_manager;

pub async fn export(pool: &SqlitePool, args: &ExportArgs) -> Result<()> {
    let users = get_users(pool).await?;
    let tasks = get_tasks(pool).await?;

    let export_dir = &args.export_dir;
    fs::create_dir_all(export_dir).await?;

    // Create CSV writer
    let csv_path = export_dir.join("ranking.csv");
    let mut wtr = Writer::from_path(csv_path)?;

    // Write CSV header
    let mut header = vec!["name", "surname", "token", "role"];
    for task in &tasks {
        header.push(&task.name);
    }
    header.push("total_score");
    wtr.write_record(&header)?;

    for user in &users {
        let user_dir = export_dir.join(&user.token);
        fs::create_dir_all(&user_dir).await?;

        let mut total_score = 0.0;
        let mut task_scores = HashMap::new();

        for task in &tasks {
            let submissions = get_submissions(pool, &user.token, &task.name).await?;
            let submissions: Vec<SubmissionFull> = submissions
                .into_iter()
                .filter(|submission| !args.filter_zero_score || submission.score > 0.0)
                .collect();

            if submissions.is_empty() {
                task_scores.insert(task.name.clone(), 0.0);
                continue;
            }

            let task_dir = user_dir.join(&task.name);
            fs::create_dir_all(&task_dir).await?;

            let mut best_submission = None;
            let mut max_score = -1.0;

            for submission in submissions {
                let submission_dir = task_dir.join(&submission.id);
                fs::create_dir_all(&submission_dir).await?;

                let source_path =
                    storage_manager::get_absolute_path(Path::new(&submission.source_path));
                let input_path =
                    storage_manager::get_absolute_path(Path::new(&submission.input_path));
                let output_path =
                    storage_manager::get_absolute_path(Path::new(&submission.output_path));

                if source_path.exists() {
                    fs::copy(
                        &source_path,
                        submission_dir.join(source_path.file_name().unwrap()),
                    )
                    .await?;
                }
                if input_path.exists() {
                    fs::copy(
                        &input_path,
                        submission_dir.join(input_path.file_name().unwrap()),
                    )
                    .await?;
                }
                if output_path.exists() {
                    fs::copy(
                        &output_path,
                        submission_dir.join(output_path.file_name().unwrap()),
                    )
                    .await?;
                }

                if submission.score > max_score {
                    max_score = submission.score;
                    best_submission = Some(submission.id.clone());
                }
            }

            if let Some(best_submission_id) = best_submission {
                let best_symlink = task_dir.join("best");
                if best_symlink.exists() {
                    fs::remove_file(&best_symlink).await?;
                }
                symlink(&best_submission_id, best_symlink)?;
            }

            let score = if max_score > 0.0 { max_score } else { 0.0 };
            task_scores.insert(task.name.clone(), score);
            total_score += score;
        }

        // Write user data to CSV
        let mut record = vec![
            user.name.clone(),
            user.surname.clone(),
            user.token.clone(),
            user.role.to_string(),
        ];
        for task in &tasks {
            let score = task_scores.get(&task.name).unwrap_or(&0.0);
            record.push(score.to_string());
        }
        record.push(total_score.to_string());
        wtr.write_record(&record)?;
    }

    wtr.flush()?;
    Ok(())
}
