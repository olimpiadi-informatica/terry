use sqlx::{Result, Sqlite};

use crate::models::Input;

pub async fn get_input_by_id<'e, E>(executor: E, id: &str) -> Result<Option<Input>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Input,
        r#"SELECT id, token, task, attempt, date as "date: _", path, size FROM inputs WHERE id = ?"#,
        id
    )
    .fetch_optional(executor)
    .await
}

pub async fn get_input<'e, E>(
    executor: E,
    token: &str,
    task: &str,
    attempt: i64,
) -> Result<Option<Input>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Input,
        r#"SELECT id, token, task, attempt, date as "date: _", path, size FROM inputs WHERE token = ? AND task = ? AND attempt = ?"#,
        token, task, attempt
    )
    .fetch_optional(executor)
    .await
}

pub async fn get_next_attempt<'e, E>(executor: E, token: &str, task: &str) -> Result<i64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let result = sqlx::query!(
        "SELECT COUNT(*) as count FROM inputs WHERE token = ? AND task = ?",
        token,
        task
    )
    .fetch_one(executor)
    .await?;
    Ok(result.count + 1)
}

pub async fn add_input<'e, E>(
    executor: E,
    id: &str,
    token: &str,
    task: &str,
    attempt: i64,
    path: &str,
    size: i64,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "INSERT INTO inputs (id, token, task, attempt, path, size) VALUES (?, ?, ?, ?, ?, ?)",
        id,
        token,
        task,
        attempt,
        path,
        size
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::tests::setup_db;
    use crate::database::{add_task, add_user, gen_id};
    use crate::models::Role;

    #[tokio::test]
    async fn test_get_next_attempt() {
        let pool = setup_db().await;

        let user_token = "user_for_attempts";
        add_user(
            &pool,
            user_token,
            "User",
            "Attempts",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_attempts";
        add_task(
            &pool,
            task_name,
            "Task for Attempts",
            "path.md",
            10.0,
            1,
            None,
        )
        .await
        .expect("Failed to add task");

        let next_attempt = get_next_attempt(&pool, user_token, task_name)
            .await
            .expect("Failed to get next attempt");
        assert_eq!(next_attempt, 1);

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

        let next_attempt = get_next_attempt(&pool, user_token, task_name)
            .await
            .expect("Failed to get next attempt");
        assert_eq!(next_attempt, 2);
    }

    #[tokio::test]
    async fn test_add_input() {
        let pool = setup_db().await;

        let user_token = "user_for_input";
        add_user(&pool, user_token, "User", "Input", false, &Role::Contestant)
            .await
            .expect("Failed to add user");
        let task_name = "task_for_input";
        add_task(&pool, task_name, "Task for Input", "path.md", 10.0, 1, None)
            .await
            .expect("Failed to add task");

        let input_id = gen_id();
        let attempt = 1;
        let path = "/path/to/input";
        let size = 1024;

        add_input(&pool, &input_id, user_token, task_name, attempt, path, size)
            .await
            .expect("Failed to add input");

        let input = get_input_by_id(&pool, &input_id)
            .await
            .expect("Failed to get input");
        assert!(input.is_some());
        let input = input.unwrap();
        assert_eq!(input.id, input_id);
        assert_eq!(input.token, user_token);
        assert_eq!(input.task, task_name);
        assert_eq!(input.attempt, attempt);
        assert_eq!(input.path, path);
        assert_eq!(input.size, size);
    }

    #[tokio::test]
    async fn test_get_input() {
        let pool = setup_db().await;

        let user_token = "user_for_get_input";
        add_user(
            &pool,
            user_token,
            "User",
            "Get Input",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_get_input";
        add_task(
            &pool,
            task_name,
            "Task for Get Input",
            "path.md",
            10.0,
            1,
            None,
        )
        .await
        .expect("Failed to add task");

        let input_id = gen_id();
        let attempt = 1;
        let path = "/path/to/get_input";
        let size = 2048;

        add_input(&pool, &input_id, user_token, task_name, attempt, path, size)
            .await
            .expect("Failed to add input");

        let input = get_input_by_id(&pool, &input_id)
            .await
            .expect("Failed to get input");
        assert!(input.is_some());
        let input = input.unwrap();
        assert_eq!(input.id, input_id);
    }
}
