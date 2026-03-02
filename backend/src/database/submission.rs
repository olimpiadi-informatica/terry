use chrono::DateTime;
use sqlx::{Result, Sqlite};

use crate::models::SubmissionFull;

macro_rules! submission_from_raw {
    ($raw: ident) => {
        SubmissionFull {
            id: $raw.id,
            token: $raw.token,
            task: $raw.task,
            score: $raw.score,
            submission_date: DateTime::from_timestamp($raw.submission_date, 0).unwrap(),
            input_id: $raw.input_id,
            input_attempt: $raw.input_attempt,
            input_date: DateTime::from_timestamp($raw.input_date, 0).unwrap(),
            input_path: $raw.input_path,
            input_size: $raw.input_size,
            output_id: $raw.output_id,
            output_date: DateTime::from_timestamp($raw.output_date, 0).unwrap(),
            output_path: $raw.output_path,
            output_size: $raw.output_size,
            output_result: serde_json::from_str(&$raw.output_result)?,
            source_id: $raw.source_id,
            source_date: DateTime::from_timestamp($raw.source_date, 0).unwrap(),
            source_path: $raw.source_path,
            source_size: $raw.source_size,
        }
    };
}

pub async fn get_submission<'e, E>(
    executor: E,
    id: &str,
) -> color_eyre::eyre::Result<Option<SubmissionFull>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let submission_raw = sqlx::query!(
        r#"
        SELECT
            s.id as "id",
            s.token as "token",
            s.task as "task",
            s.score as "score",
            s.date as "submission_date",
            i.id AS "input_id",
            i.attempt AS "input_attempt",
            i.date AS "input_date",
            i.path AS "input_path",
            i.size AS "input_size",
            o.id AS "output_id",
            o.date AS "output_date",
            o.path AS "output_path",
            o.size AS "output_size",
            o.result AS "output_result",
            src.id AS "source_id",
            src.date AS "source_date",
            src.path AS "source_path",
            src.size AS "source_size"
        FROM submissions s
        JOIN inputs i ON s.input = i.id
        JOIN outputs o ON s.output = o.id
        JOIN sources src ON s.source = src.id
        WHERE s.id = ?
        "#,
        id
    )
    .fetch_optional(executor)
    .await?;

    if let Some(raw) = submission_raw {
        Ok(Some(submission_from_raw!(raw)))
    } else {
        Ok(None)
    }
}

pub async fn get_submissions<'e, E>(
    executor: E,
    token: &str,
    task: &str,
) -> color_eyre::eyre::Result<Vec<SubmissionFull>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let submissions_raw = sqlx::query!(
        r#"
        SELECT
            s.id as "id",
            s.token as "token",
            s.task as "task",
            s.score as "score",
            s.date as "submission_date",
            i.id AS "input_id",
            i.attempt AS "input_attempt",
            i.date AS "input_date",
            i.path AS "input_path",
            i.size AS "input_size",
            o.id AS "output_id",
            o.date AS "output_date",
            o.path AS "output_path",
            o.size AS "output_size",
            o.result AS "output_result",
            src.id AS "source_id",
            src.date AS "source_date",
            src.path AS "source_path",
            src.size AS "source_size"
        FROM submissions s
        JOIN inputs i ON s.input = i.id
        JOIN outputs o ON s.output = o.id
        JOIN sources src ON s.source = src.id
        WHERE s.token = ? AND s.task = ?
        ORDER BY i.attempt ASC
        "#,
        token,
        task
    )
    .fetch_all(executor)
    .await?;

    submissions_raw
        .into_iter()
        .map(|raw| Ok(submission_from_raw!(raw)))
        .collect()
}

pub async fn add_submission<'e, E>(
    executor: E,
    id: &str,
    input: &str,
    output: &str,
    source: &str,
    score: f64,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        r#"
        INSERT INTO submissions (id, token, task, input, output, source, score)
        SELECT ?, i.token, i.task, ?, ?, ?, ?
        FROM inputs i
        WHERE i.id = ?
        "#,
        id,
        input,
        output,
        source,
        score,
        input
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::tests::setup_db;
    use crate::database::{add_input, add_output, add_source, add_task, add_user, gen_id};
    use crate::models::Role;

    #[tokio::test]
    async fn test_add_submission() {
        let pool = setup_db().await;

        let user_token = "user_for_submission";
        add_user(
            &pool,
            user_token,
            "User",
            "Submission",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_submission";
        add_task(
            &pool,
            task_name,
            "Task for Submission",
            "path.md",
            10.0,
            1,
            None,
        )
        .await
        .expect("Failed to add task");

        let input_id = gen_id();
        add_input(
            &pool,
            &input_id,
            user_token,
            task_name,
            1,
            "input_path",
            100,
        )
        .await
        .expect("Failed to add input");

        let source_id = gen_id();
        add_source(&pool, &source_id, &input_id, "source_path", 512)
            .await
            .expect("Failed to add source");

        let output_id = gen_id();
        let result = "{\"score\": 1.0, \"validation\": {\"cases\": [], \"alerts\": []}, \"feedback\": {\"cases\": [], \"alerts\": []}}";
        add_output(&pool, &output_id, &input_id, "output_path", 768, result)
            .await
            .expect("Failed to add output");

        let submission_id = gen_id();
        let score = 100.0;

        add_submission(
            &pool,
            &submission_id,
            &input_id,
            &output_id,
            &source_id,
            score,
        )
        .await
        .expect("Failed to add submission");

        let submission = get_submission(&pool, &submission_id)
            .await
            .expect("Failed to get submission");
        assert!(submission.is_some());
        let submission = submission.unwrap();
        assert_eq!(submission.id, submission_id);
        assert_eq!(submission.token, user_token);
        assert_eq!(submission.task, task_name);
        assert_eq!(submission.input_id, input_id);
        assert_eq!(submission.output_id, output_id);
        assert_eq!(submission.source_id, source_id);
        assert_eq!(submission.score, score);
    }

    #[tokio::test]
    async fn test_get_submission() {
        let pool = setup_db().await;

        let user_token = "user_for_get_submission";
        add_user(
            &pool,
            user_token,
            "User",
            "Get Submission",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_get_submission";
        add_task(
            &pool,
            task_name,
            "Task for Get Submission",
            "path.md",
            10.0,
            1,
            None,
        )
        .await
        .expect("Failed to add task");

        let input_id = gen_id();
        add_input(
            &pool,
            &input_id,
            user_token,
            task_name,
            1,
            "input_path",
            100,
        )
        .await
        .expect("Failed to add input");

        let source_id = gen_id();
        add_source(&pool, &source_id, &input_id, "source_path", 512)
            .await
            .expect("Failed to add source");

        let output_id = gen_id();
        let result = "{\"score\": 1.0, \"validation\": {\"cases\": [], \"alerts\": []}, \"feedback\": {\"cases\": [], \"alerts\": []}}";
        add_output(&pool, &output_id, &input_id, "output_path", 768, result)
            .await
            .expect("Failed to add output");

        let submission_id = gen_id();
        let score = 100.0;

        add_submission(
            &pool,
            &submission_id,
            &input_id,
            &output_id,
            &source_id,
            score,
        )
        .await
        .expect("Failed to add submission");

        let submission = get_submission(&pool, &submission_id)
            .await
            .expect("Failed to get submission");
        assert!(submission.is_some());
        let submission = submission.unwrap();
        assert_eq!(submission.id, submission_id);
    }

    #[tokio::test]
    async fn test_get_submissions() {
        let pool = setup_db().await;

        let user_token = "user_for_submissions";
        add_user(
            &pool,
            user_token,
            "User",
            "Submissions",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_submissions";
        add_task(
            &pool,
            task_name,
            "Task for Submissions",
            "path.md",
            10.0,
            1,
            None,
        )
        .await
        .expect("Failed to add task");

        for i in 1..=3 {
            let input_id = gen_id();
            add_input(
                &pool,
                &input_id,
                user_token,
                task_name,
                i,
                &format!("input_path_{}", i),
                100,
            )
            .await
            .expect("Failed to add input");

            let source_id = gen_id();
            add_source(
                &pool,
                &source_id,
                &input_id,
                &format!("source_path_{}", i),
                512,
            )
            .await
            .expect("Failed to add source");

            let output_id = gen_id();
            let result = format!(
                "{{\"score\": {}, \"validation\": {{ \"cases\": [], \"alerts\": [] }}, \"feedback\": {{ \"cases\": [], \"alerts\": [] }} }}",
                i as f64
            );
            add_output(
                &pool,
                &output_id,
                &input_id,
                &format!("output_path_{}", i),
                768,
                &result,
            )
            .await
            .expect("Failed to add output");

            let submission_id = gen_id();
            let score = i as f64 * 10.0;
            add_submission(
                &pool,
                &submission_id,
                &input_id,
                &output_id,
                &source_id,
                score,
            )
            .await
            .expect("Failed to add submission");
        }

        let submissions = get_submissions(&pool, user_token, task_name)
            .await
            .expect("Failed to get submissions");
        assert_eq!(submissions.len(), 3);

        assert_eq!(submissions[0].score, 10.0);
        assert_eq!(submissions[1].score, 20.0);
        assert_eq!(submissions[2].score, 30.0);
    }
}
