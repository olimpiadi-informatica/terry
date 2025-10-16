pub mod announcement;
pub mod input;
pub mod output;
pub mod question;
pub mod source;
pub mod submission;
pub mod task;
pub mod user;
pub mod user_task;

pub use announcement::*;
pub use input::*;
pub use output::*;
pub use question::*;
pub use source::*;
pub use submission::*;
pub use task::*;
pub use user::*;
pub use user_task::*;

pub fn gen_id() -> String {
    uuid::Uuid::new_v4().to_string()
}

#[cfg(test)]
mod tests {
    use sqlx::SqlitePool;

    pub async fn setup_db() -> SqlitePool {
        let pool = SqlitePool::connect("sqlite::memory:")
            .await
            .expect("Failed to connect to in-memory database");
        sqlx::migrate!("./migrations")
            .run(&pool)
            .await
            .expect("Failed to run migrations");
        pool
    }

    #[tokio::test]
    async fn test_gen_id() {
        let id = super::gen_id();
        assert!(!id.is_empty());
        assert!(id.len() >= 10);
    }
}
