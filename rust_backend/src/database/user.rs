use sqlx::{Result, Sqlite};

use crate::models::User;

pub async fn get_user<'e, E>(executor: E, token: &str) -> Result<Option<User>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        User,
        "SELECT token, name, surname, extra_time, sso_user, contest_start_delay, role as 'role: _' FROM users WHERE token = ?",
        token
    )
    .fetch_optional(executor)
    .await
}

pub async fn get_users<'e, E>(executor: E) -> Result<Vec<User>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        User,
        "SELECT token, name, surname, extra_time, sso_user, contest_start_delay, role as 'role: _' FROM users"
    )
    .fetch_all(executor)
    .await
}

pub async fn add_user<'e, E>(
    executor: E,
    token: &str,
    name: &str,
    surname: &str,
    sso_user: bool,
    role: &crate::models::Role,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "INSERT INTO users (token, name, surname, sso_user, role) VALUES (?, ?, ?, ?, ?)",
        token,
        name,
        surname,
        sso_user,
        role
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

pub async fn set_extra_time<'e, E>(executor: E, token: &str, extra_time: i64) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "UPDATE users SET extra_time = ? WHERE token = ?",
        extra_time,
        token
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

pub async fn set_start_delay<'e, E>(executor: E, token: &str, start_delay: i64) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "UPDATE users SET contest_start_delay = ? WHERE token = ?",
        start_delay,
        token
    )
    .execute(executor)
    .await?;

    Ok(rows_affected.rows_affected())
}

pub async fn update_user_info<'e, E>(
    executor: E,
    token: &str,
    name: &str,
    surname: &str,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "UPDATE users SET name = ?, surname = ? WHERE token = ?",
        name,
        surname,
        token
    )
    .execute(executor)
    .await?;

    Ok(rows_affected.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::tests::setup_db;
    use crate::models::Role;

    #[tokio::test]
    async fn test_add_user() {
        let pool = setup_db().await;
        let token = "test_user_add";
        let name = "Test";
        let surname = "User";
        let sso_user = false;
        let role = Role::Contestant;

        add_user(&pool, token, name, surname, sso_user, &role)
            .await
            .expect("Failed to add user");

        let user = get_user(&pool, token).await.expect("Failed to get user");
        assert!(user.is_some());
        let user = user.unwrap();
        assert_eq!(user.token, token);
        assert_eq!(user.name, name);
        assert_eq!(user.surname, surname);
        assert_eq!(user.sso_user, 0);
        assert_eq!(user.role, Role::Contestant);
    }

    #[tokio::test]
    async fn test_get_user() {
        let pool = setup_db().await;
        let token = "test_get_user";
        let name = "Get";
        let surname = "User";
        let sso_user = false;
        let role = Role::Contestant;

        add_user(&pool, token, name, surname, sso_user, &role)
            .await
            .expect("Failed to add user");

        let user = get_user(&pool, token).await.expect("Failed to get user");
        assert!(user.is_some());
        let user = user.unwrap();
        assert_eq!(user.token, token);
    }

    #[tokio::test]
    async fn test_get_users() {
        let pool = setup_db().await;

        add_user(
            &pool,
            "user1",
            "Name1",
            "Surname1",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user1");
        add_user(
            &pool,
            "user2",
            "Name2",
            "Surname2",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user2");

        let users = get_users(&pool).await.expect("Failed to get users");
        assert_eq!(users.len(), 2);
    }

    #[tokio::test]
    async fn test_set_extra_time() {
        let pool = setup_db().await;
        let token = "test_extra_time_user";
        add_user(&pool, token, "Extra", "Time", false, &Role::Contestant)
            .await
            .expect("Failed to add user");

        let extra_time_to_set = 3600;
        set_extra_time(&pool, token, extra_time_to_set)
            .await
            .expect("Failed to set extra time");

        let updated_user = get_user(&pool, token)
            .await
            .expect("Failed to get user")
            .unwrap();
        assert_eq!(updated_user.extra_time, extra_time_to_set);
    }

    #[tokio::test]
    async fn test_set_start_delay() {
        let pool = setup_db().await;
        let token = "test_start_delay_user";
        add_user(&pool, token, "Start", "Delay", false, &Role::Contestant)
            .await
            .expect("Failed to add user");

        let start_delay_to_set = 600;
        set_start_delay(&pool, token, start_delay_to_set)
            .await
            .expect("Failed to set start delay");

        let updated_user = get_user(&pool, token)
            .await
            .expect("Failed to get user")
            .unwrap();
        assert_eq!(updated_user.contest_start_delay, Some(start_delay_to_set));
    }

    #[tokio::test]
    async fn test_update_user_info() {
        let pool = setup_db().await;
        let token = "test_update_user";
        add_user(&pool, token, "Initial", "User", false, &Role::Contestant)
            .await
            .expect("Failed to add user");

        let new_name = "Updated";
        let new_surname = "Person";
        update_user_info(&pool, token, new_name, new_surname)
            .await
            .expect("Failed to update user info");

        let updated_user = get_user(&pool, token)
            .await
            .expect("Failed to get user")
            .unwrap();
        assert_eq!(updated_user.name, new_name);
        assert_eq!(updated_user.surname, new_surname);
    }
}
