use sqlx::{Result, Sqlite};

use crate::models::Question;

pub async fn get_questions<'e, E>(executor: E, token: &str) -> Result<Vec<Question>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Question,
        r#"SELECT id, content, creator, date as "date: _", answer, answerer, answer_date as "answer_date: _" FROM questions WHERE creator = ? ORDER BY date"#,
        token,
    )
    .fetch_all(executor)
    .await
}

pub async fn get_all_questions<'e, E>(executor: E) -> Result<Vec<Question>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Question,
        r#"SELECT id, content, creator, date as "date: _", answer, answerer, answer_date as "answer_date: _" FROM questions ORDER BY date"#
    )
    .fetch_all(executor)
    .await
}

pub async fn add_question<'e, E>(executor: E, token: &str, content: &str) -> Result<i64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let result = sqlx::query!(
        "INSERT INTO questions (creator, content) VALUES (?, ?)",
        token,
        content
    )
    .execute(executor)
    .await?;
    Ok(result.last_insert_rowid())
}

pub async fn get_question<'e, E>(executor: E, id: i64) -> Result<Option<Question>>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    sqlx::query_as!(
        Question,
        r#"SELECT id, content, creator, date as "date: _", answer, answerer, answer_date as "answer_date: _" FROM questions WHERE id = ?"#,
        id
    )
    .fetch_optional(executor)
    .await
}

pub async fn answer_question<'e, E>(
    executor: E,
    id: i64,
    answer: &str,
    answerer: &str,
) -> Result<u64>
where
    E: sqlx::Executor<'e, Database = Sqlite>,
{
    let rows_affected = sqlx::query!(
        "UPDATE questions SET answer = ?, answerer = ?, answer_date = CURRENT_TIMESTAMP WHERE id = ?",
        answer,
        answerer,
        id
    )
    .execute(executor)
    .await?;
    Ok(rows_affected.rows_affected())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::tests::setup_db;
    use crate::database::{add_user, get_all_questions};
    use crate::models::Role;

    #[tokio::test]
    async fn test_add_question() {
        let pool = setup_db().await;

        let user_token = "user_for_question";
        add_user(
            &pool,
            user_token,
            "User",
            "Question",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");

        let content = "What is the meaning of life?";
        let question_id = add_question(&pool, user_token, content)
            .await
            .expect("Failed to add question");

        let question = get_question(&pool, question_id)
            .await
            .expect("Failed to get question");
        assert!(question.is_some());
        let question = question.unwrap();
        assert_eq!(question.id, question_id);
        assert_eq!(question.creator, user_token);
        assert_eq!(question.content, content);
        assert!(question.answer.is_none());
    }

    #[tokio::test]
    async fn test_get_question() {
        let pool = setup_db().await;

        let user_token = "user_for_get_question";
        add_user(
            &pool,
            user_token,
            "User",
            "Get Question",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");

        let content = "How do I get to the next level?";
        let question_id = add_question(&pool, user_token, content)
            .await
            .expect("Failed to add question");

        let question = get_question(&pool, question_id)
            .await
            .expect("Failed to get question");
        assert!(question.is_some());
        let question = question.unwrap();
        assert_eq!(question.id, question_id);
        assert_eq!(question.creator, user_token);
        assert_eq!(question.content, content);
    }

    #[tokio::test]
    async fn test_get_questions() {
        let pool = setup_db().await;

        let user1_token = "user1_for_questions";
        add_user(
            &pool,
            user1_token,
            "User1",
            "Questions",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user1");
        let user2_token = "user2_for_questions";
        add_user(
            &pool,
            user2_token,
            "User2",
            "Questions",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user2");

        add_question(&pool, user1_token, "Question 1 by User1")
            .await
            .expect("Failed to add question 1");
        add_question(&pool, user2_token, "Question 2 by User2")
            .await
            .expect("Failed to add question 2");
        add_question(&pool, user1_token, "Question 3 by User1")
            .await
            .expect("Failed to add question 3");

        let user1_questions = get_questions(&pool, user1_token)
            .await
            .expect("Failed to get questions for user1");
        assert_eq!(user1_questions.len(), 2);

        let user2_questions = get_questions(&pool, user2_token)
            .await
            .expect("Failed to get questions for user2");
        assert_eq!(user2_questions.len(), 1);

        let all_questions = get_all_questions(&pool)
            .await
            .expect("Failed to get all questions");
        assert_eq!(all_questions.len(), 3);
    }

    #[tokio::test]
    async fn test_answer_question() {
        let pool = setup_db().await;

        let user_token = "user_for_answer";
        add_user(
            &pool,
            user_token,
            "User",
            "Answer",
            false,
            &Role::Contestant,
        )
        .await
        .expect("Failed to add user");
        let admin_token = "admin_for_answer";
        add_user(&pool, admin_token, "Admin", "Answer", false, &Role::Admin)
            .await
            .expect("Failed to add admin");

        let content = "What is the capital of France?";
        let question_id = add_question(&pool, user_token, content)
            .await
            .expect("Failed to add question");

        let answer_content = "Paris";
        answer_question(&pool, question_id, answer_content, admin_token)
            .await
            .expect("Failed to answer question");

        let answered_question = get_question(&pool, question_id)
            .await
            .expect("Failed to get answered question");
        assert!(answered_question.is_some());
        let answered_question = answered_question.unwrap();
        assert_eq!(answered_question.answer, Some(answer_content.to_string()));
        assert_eq!(answered_question.answerer, Some(admin_token.to_string()));
        assert!(answered_question.answer_date.is_some());
    }
}
