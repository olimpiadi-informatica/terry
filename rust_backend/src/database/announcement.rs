use sqlx::{Result, Sqlite};

use crate::models::Announcement;

pub async fn list_announcements<'e, E>(executor: E) -> Result<Vec<Announcement>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Announcement,
        r#"SELECT id, severity, title, content, date as "date: _", creator FROM announcements ORDER BY date"#
    )
    .fetch_all(executor)
    .await
}

pub async fn add_announcement<'e, E>(
    executor: E,
    severity: &str,
    title: &str,
    content: &str,
    creator: &str,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "INSERT INTO announcements (severity, title, content, creator) VALUES (?, ?, ?, ?)",
        severity,
        title,
        content,
        creator
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::add_user;
    use crate::database::tests::setup_db;
    use crate::models::Role;

    #[tokio::test]
    async fn test_add_announcement() {
        let pool = setup_db().await;

        let creator_token = "creator_for_announcement";
        add_user(
            &pool,
            creator_token,
            "Creator",
            "Announcement",
            false,
            &Role::Admin,
        )
        .await
        .expect("Failed to add creator");

        let severity = "info";
        let title = "Test Announcement";
        let content = "This is a test announcement.";

        add_announcement(&pool, severity, title, content, creator_token)
            .await
            .expect("Failed to add announcement");

        let announcements = list_announcements(&pool)
            .await
            .expect("Failed to list announcements");
        assert_eq!(announcements.len(), 1);

        let announcement = &announcements[0];
        assert_eq!(announcement.severity, severity);
        assert_eq!(announcement.title, title);
        assert_eq!(announcement.content, content);
        assert_eq!(announcement.creator, creator_token);
    }

    #[tokio::test]
    async fn test_list_announcements() {
        let pool = setup_db().await;

        let creator_token = "creator_for_list_announcements";
        add_user(
            &pool,
            creator_token,
            "Creator",
            "List Announcements",
            false,
            &Role::Admin,
        )
        .await
        .expect("Failed to add creator");

        add_announcement(&pool, "info", "Title 1", "Content 1", creator_token)
            .await
            .expect("Failed to add announcement 1");
        add_announcement(&pool, "warning", "Title 2", "Content 2", creator_token)
            .await
            .expect("Failed to add announcement 2");

        let announcements = list_announcements(&pool)
            .await
            .expect("Failed to list announcements");
        assert_eq!(announcements.len(), 2);
    }
}
