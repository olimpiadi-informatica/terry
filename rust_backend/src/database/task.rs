use sqlx::{Result, Sqlite, SqlitePool};

use crate::models::Task;

pub async fn get_tasks<'e, E>(executor: E) -> Result<Vec<Task>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Task,
        "SELECT name, title, statement_path, max_score, num, submission_timeout FROM tasks ORDER BY num ASC"
    )
    .fetch_all(executor)
    .await
}

pub async fn get_task<'e, E>(executor: E, name: &str) -> Result<Option<Task>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Task,
        "SELECT name, title, statement_path, max_score, num, submission_timeout FROM tasks WHERE name = ?",
        name
    )
    .fetch_optional(executor)
    .await
}

pub async fn add_task<'e, E>(
    executor: E,
    name: &str,
    title: &str,
    statement_path: &str,
    max_score: f64,
    num: i64,
    submission_timeout: Option<i64>,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        r#"
        INSERT INTO tasks (name, title, statement_path, max_score, num, submission_timeout)
        VALUES (?, ?, ?, ?, ?, ?)
        "#,
        name,
        title,
        statement_path,
        max_score,
        num,
        submission_timeout
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

pub async fn shift_tasks(pool: &SqlitePool, start_num: i64) -> Result<u64> {
    let tasks_to_shift = sqlx::query!(
        "SELECT name, num FROM tasks WHERE num >= ? ORDER BY num DESC",
        start_num
    )
    .fetch_all(pool)
    .await?;

    let mut total_rows_affected = 0;
    for task in tasks_to_shift {
        let new_num = task.num + 1;
        let task_name = task.name.clone();
        let rows_affected = sqlx::query!(
            "UPDATE tasks SET num = ? WHERE name = ?",
            new_num,
            task_name
        )
        .execute(pool)
        .await?;
        total_rows_affected += rows_affected.rows_affected();
    }

    Ok(total_rows_affected)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::tests::setup_db;

    #[tokio::test]
    async fn test_add_task() {
        let pool = setup_db().await;
        let name = "test_task";
        let title = "Test Task";
        let statement_path = "path/to/statement.md";
        let max_score = 100.0;
        let num = 1;
        let submission_timeout = Some(300);

        add_task(
            &pool,
            name,
            title,
            statement_path,
            max_score,
            num,
            submission_timeout,
        )
        .await
        .expect("Failed to add task");

        let task = get_task(&pool, name).await.expect("Failed to get task");
        assert!(task.is_some());
        let task = task.unwrap();
        assert_eq!(task.name, name);
        assert_eq!(task.title, title);
        assert_eq!(task.statement_path, statement_path);
        assert_eq!(task.max_score, max_score);
        assert_eq!(task.num, num);
        assert_eq!(task.submission_timeout, submission_timeout);
    }

    #[tokio::test]
    async fn test_get_task() {
        let pool = setup_db().await;
        let name = "test_get_task";
        let title = "Get Task";
        let statement_path = "path/to/get_task_statement.md";
        let max_score = 50.0;
        let num = 2;
        let submission_timeout = None;

        add_task(
            &pool,
            name,
            title,
            statement_path,
            max_score,
            num,
            submission_timeout,
        )
        .await
        .expect("Failed to add task");

        let task = get_task(&pool, name).await.expect("Failed to get task");
        assert!(task.is_some());
        let task = task.unwrap();
        assert_eq!(task.name, name);
    }

    #[tokio::test]
    async fn test_get_tasks() {
        let pool = setup_db().await;

        add_task(&pool, "task1", "Task One", "path1.md", 10.0, 1, None)
            .await
            .expect("Failed to add task1");
        add_task(&pool, "task2", "Task Two", "path2.md", 20.0, 2, Some(60))
            .await
            .expect("Failed to add task2");

        let tasks = get_tasks(&pool).await.expect("Failed to get tasks");
        assert_eq!(tasks.len(), 2);
    }

    #[tokio::test]
    async fn test_shift_tasks() {
        let pool = setup_db().await;

        add_task(&pool, "taskA", "Task A", "pathA.md", 10.0, 1, None)
            .await
            .expect("Failed to add taskA");
        add_task(&pool, "taskB", "Task B", "pathB.md", 20.0, 2, None)
            .await
            .expect("Failed to add taskB");
        add_task(&pool, "taskC", "Task C", "pathC.md", 30.0, 3, None)
            .await
            .expect("Failed to add taskC");

        shift_tasks(&pool, 2).await.expect("Failed to shift tasks");

        let tasks = get_tasks(&pool).await.expect("Failed to get tasks");

        let task_a = tasks.iter().find(|t| t.name == "taskA").unwrap();
        assert_eq!(task_a.num, 1);

        let task_b = tasks.iter().find(|t| t.name == "taskB").unwrap();
        assert_eq!(task_b.num, 3);

        let task_c = tasks.iter().find(|t| t.name == "taskC").unwrap();
        assert_eq!(task_c.num, 4);
    }
}
