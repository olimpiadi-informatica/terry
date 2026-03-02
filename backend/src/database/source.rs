use sqlx::{Result, Sqlite};

use crate::models::Source;

pub async fn get_source<'e, E>(executor: E, id: &str) -> Result<Option<Source>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Source,
        r#"SELECT id, input, date as "date: _", path, size FROM sources WHERE id = ?"#,
        id
    )
    .fetch_optional(executor)
    .await
}

pub async fn add_source<'e, E>(
    executor: E,
    id: &str,
    input: &str,
    path: &str,
    size: i64,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "INSERT INTO sources (id, input, path, size) VALUES (?, ?, ?, ?)",
        id,
        input,
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
    use crate::database::{add_input, add_task, add_user, gen_id};
    use crate::models::Role;

    #[tokio::test]
    async fn test_add_source() {
        let pool = setup_db().await;

        let user_token = "user_for_source";
        add_user(
            &pool,
            user_token,
            "User",
            "Source",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_source";
        add_task(
            &pool,
            task_name,
            "Task for Source",
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
        let path = "/path/to/source";
        let size = 512;

        add_source(&pool, &source_id, &input_id, path, size)
            .await
            .expect("Failed to add source");

        let source = get_source(&pool, &source_id)
            .await
            .expect("Failed to get source");
        assert!(source.is_some());
        let source = source.unwrap();
        assert_eq!(source.id, source_id);
        assert_eq!(source.input, input_id);
        assert_eq!(source.path, path);
        assert_eq!(source.size, size);
    }

    #[tokio::test]
    async fn test_get_source() {
        let pool = setup_db().await;

        let user_token = "user_for_get_source";
        add_user(
            &pool,
            user_token,
            "User",
            "Get Source",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_get_source";
        add_task(
            &pool,
            task_name,
            "Task for Get Source",
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
        let path = "/path/to/get_source";
        let size = 512;

        add_source(&pool, &source_id, &input_id, path, size)
            .await
            .expect("Failed to add source");

        let source = get_source(&pool, &source_id)
            .await
            .expect("Failed to get source");
        assert!(source.is_some());
        let source = source.unwrap();
        assert_eq!(source.id, source_id);
    }
}
