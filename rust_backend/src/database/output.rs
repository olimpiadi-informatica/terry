use sqlx::{Result, Sqlite};

use crate::models::Output;

pub async fn get_output<'e, E>(executor: E, id: &str) -> Result<Option<Output>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Output,
        r#"SELECT id, input, date as "date: _", path, size, result FROM outputs WHERE id = ?"#,
        id
    )
    .fetch_optional(executor)
    .await
}

pub async fn add_output<'e, E>(
    executor: E,
    id: &str,
    input: &str,
    path: &str,
    size: i64,
    result: &str,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "INSERT INTO outputs (id, input, path, size, result) VALUES (?, ?, ?, ?, ?)",
        id,
        input,
        path,
        size,
        result
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::tests::setup_db;
    use crate::database::{add_input, add_task, add_user, gen_id};
    use crate::models::Role;

    #[tokio::test]
    async fn test_add_output() {
        let pool = setup_db().await;

        let user_token = "user_for_output";
        add_user(
            &pool,
            user_token,
            "User",
            "Output",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_output";
        add_task(
            &pool,
            task_name,
            "Task for Output",
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

        let output_id = gen_id();
        let path = "/path/to/output";
        let size = 768;
        let result = "{\"score\": 1.0, \"validation\": {\"cases\": [], \"alerts\": []}, \"feedback\": {\"cases\": [], \"alerts\": []}}";

        add_output(&pool, &output_id, &input_id, path, size, result)
            .await
            .expect("Failed to add output");

        let output = get_output(&pool, &output_id)
            .await
            .expect("Failed to get output");
        assert!(output.is_some());
        let output = output.unwrap();
        assert_eq!(output.id, output_id);
        assert_eq!(output.input, input_id);
        assert_eq!(output.path, path);
        assert_eq!(output.size, size);
        assert_eq!(output.result, result);
    }

    #[tokio::test]
    async fn test_get_output() {
        let pool = setup_db().await;

        let user_token = "user_for_get_output";
        add_user(
            &pool,
            user_token,
            "User",
            "Get Output",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_get_output";
        add_task(
            &pool,
            task_name,
            "Task for Get Output",
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

        let output_id = gen_id();
        let path = "/path/to/get_output";
        let size = 768;
        let result = "{\"score\": 1.0, \"validation\": {\"cases\": [], \"alerts\": []}, \"feedback\": {\"cases\": [], \"alerts\": []}}";

        add_output(&pool, &output_id, &input_id, path, size, result)
            .await
            .expect("Failed to add output");

        let output = get_output(&pool, &output_id)
            .await
            .expect("Failed to get output");
        assert!(output.is_some());
        let output = output.unwrap();
        assert_eq!(output.id, output_id);
    }
}
