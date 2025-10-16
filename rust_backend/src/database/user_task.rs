use sqlx::{Result, Sqlite};

use crate::models::UserTask;

pub async fn get_user_task<'e, E>(executor: E, token: &str, task: &str) -> Result<Option<UserTask>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        UserTask,
        "SELECT token, task, score, current_attempt FROM user_tasks WHERE token = ? AND task = ?",
        token,
        task
    )
    .fetch_optional(executor)
    .await
}

pub async fn get_user_tasks<'e, E>(executor: E, token: &str) -> Result<Vec<UserTask>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        UserTask,
        "SELECT token, task, score, current_attempt FROM user_tasks WHERE token = ?",
        token
    )
    .fetch_all(executor)
    .await
}

pub async fn add_user_task<'e, E>(executor: E, token: &str, task: &str) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "INSERT INTO user_tasks (token, task) VALUES (?, ?)",
        token,
        task
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

pub async fn set_user_score<'e, E>(executor: E, token: &str, task: &str, score: f64) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "UPDATE user_tasks SET score = ? WHERE token = ? AND task = ?",
        score,
        token,
        task
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

pub async fn set_user_attempt<'e, E>(
    executor: E,
    token: &str,
    task: &str,
    attempt: Option<i64>,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "UPDATE user_tasks SET current_attempt = ? WHERE token = ? AND task = ?",
        attempt,
        token,
        task
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
    async fn test_add_user_task() {
        let pool = setup_db().await;

        let user_token = "user_for_task";
        add_user(&pool, user_token, "User", "Task", false, &Role::Contestant)
            .await
            .expect("Failed to add user");
        let task_name = "task_for_user";
        add_task(&pool, task_name, "Task for User", "path.md", 10.0, 1, None)
            .await
            .expect("Failed to add task");

        add_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to add user task");

        let user_task = get_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to get user task");
        assert!(user_task.is_some());
        let user_task = user_task.unwrap();
        assert_eq!(user_task.token, user_token);
        assert_eq!(user_task.task, task_name);
        assert_eq!(user_task.score, 0.0);
        assert!(user_task.current_attempt.is_none());
    }

    #[tokio::test]
    async fn test_get_user_task() {
        let pool = setup_db().await;

        let user_token = "user_for_get_task";
        add_user(
            &pool,
            user_token,
            "User",
            "Get Task",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_get_user";
        add_task(
            &pool,
            task_name,
            "Task for Get User",
            "path.md",
            10.0,
            1,
            None,
        )
        .await
        .expect("Failed to add task");

        add_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to add user task");

        let user_task = get_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to get user task");
        assert!(user_task.is_some());
        let user_task = user_task.unwrap();
        assert_eq!(user_task.token, user_token);
        assert_eq!(user_task.task, task_name);
    }

    #[tokio::test]
    async fn test_get_user_tasks() {
        let pool = setup_db().await;

        let user_token = "user_for_multiple_tasks";
        add_user(
            &pool,
            user_token,
            "User",
            "Multiple Tasks",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        add_task(&pool, "task1", "Task One", "path1.md", 10.0, 1, None)
            .await
            .expect("Failed to add task1");
        add_task(&pool, "task2", "Task Two", "path2.md", 20.0, 2, None)
            .await
            .expect("Failed to add task2");

        add_user_task(&pool, user_token, "task1")
            .await
            .expect("Failed to add user task1");
        add_user_task(&pool, user_token, "task2")
            .await
            .expect("Failed to add user task2");

        let user_tasks = get_user_tasks(&pool, user_token)
            .await
            .expect("Failed to get user tasks");
        assert_eq!(user_tasks.len(), 2);
    }

    #[tokio::test]
    async fn test_set_user_score() {
        let pool = setup_db().await;

        let user_token = "user_for_score";
        add_user(&pool, user_token, "User", "Score", false, &Role::Contestant)
            .await
            .expect("Failed to add user");
        let task_name = "task_for_score";
        add_task(&pool, task_name, "Task for Score", "path.md", 10.0, 1, None)
            .await
            .expect("Failed to add task");

        add_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to add user task");

        let user_task = get_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to get user task")
            .unwrap();
        assert_eq!(user_task.score, 0.0);

        let new_score = 50.0;
        set_user_score(&pool, user_token, task_name, new_score)
            .await
            .expect("Failed to set user score");

        let updated_user_task = get_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to get user task")
            .unwrap();
        assert_eq!(updated_user_task.score, new_score);
    }

    #[tokio::test]
    async fn test_set_user_attempt() {
        let pool = setup_db().await;

        let user_token = "user_for_attempt";
        add_user(
            &pool,
            user_token,
            "User",
            "Attempt",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let task_name = "task_for_attempt";
        add_task(
            &pool,
            task_name,
            "Task for Attempt",
            "path.md",
            10.0,
            1,
            None,
        )
        .await
        .expect("Failed to add task");

        add_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to add user task");

        let user_task = get_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to get user task")
            .unwrap();
        assert!(user_task.current_attempt.is_none());

        let input_id = gen_id();
        add_input(
            &pool,
            &input_id,
            user_token,
            task_name,
            1,
            "input_path_attempt_1",
            100,
        )
        .await
        .expect("Failed to add input");

        let new_attempt = Some(1);
        set_user_attempt(&pool, user_token, task_name, new_attempt)
            .await
            .expect("Failed to set user attempt");

        let updated_user_task = get_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to get user task")
            .unwrap();
        assert_eq!(updated_user_task.current_attempt, new_attempt);

        set_user_attempt(&pool, user_token, task_name, None)
            .await
            .expect("Failed to set user attempt to None");
        let reset_user_task = get_user_task(&pool, user_token, task_name)
            .await
            .expect("Failed to get user task")
            .unwrap();
        assert!(reset_user_task.current_attempt.is_none());
    }
}
