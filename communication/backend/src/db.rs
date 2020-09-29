use std::path::Path;
use crate::AddAnnouncement;
use crate::AnswerQuestion;
use crate::AskQuestion;
use actix_web::web;
use failure::Fallible;
use r2d2_sqlite::SqliteConnectionManager;
use rusqlite::Row;
use rusqlite::{params, NO_PARAMS};
use serde::Serialize;

pub type Pool = r2d2::Pool<r2d2_sqlite::SqliteConnectionManager>;
pub type FallibleQuery<T> = std::result::Result<T, actix_web::Error>;

pub fn connect<P: AsRef<Path>>(path: P) -> Fallible<Pool> {
    let manager = SqliteConnectionManager::file(path.as_ref())
        .with_init(|c| c.execute_batch("PRAGMA foreign_keys=1;"));
    Pool::new(manager).map_err(|e| e.into())
}

#[derive(Debug, Serialize)]
pub struct Announcement {
    pub id: i64,
    pub severity: String,
    pub title: String,
    pub content: String,
    pub date: String,
}

pub async fn list_announcements(pool: &Pool) -> FallibleQuery<Vec<Announcement>> {
    let conn = pool.get();
    web::block(move || -> Fallible<_> {
        let conn = conn?;
        let mut stmt = conn.prepare(
            "
            SELECT id, severity, title, content, date
            FROM announcements
            ORDER BY date",
        )?;
        stmt.query_map(NO_PARAMS, |row| {
            Ok(Announcement {
                id: row.get(0)?,
                severity: row.get(1)?,
                title: row.get(2)?,
                content: row.get(3)?,
                date: row.get(4)?,
            })
        })
        .and_then(Iterator::collect)
        .map_err(|e| e.into())
    })
    .await
    .map_err(|e| e.into())
}

#[derive(Debug, Serialize)]
pub struct Answer {
    pub date: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct Question {
    pub id: i64,
    pub content: String,
    pub date: String,
    pub answer: Option<Answer>,
}

impl Question {
    fn from_row<'s, 't>(row: &'s Row<'t>) -> rusqlite::Result<Question> {
        Ok(Question {
            id: row.get(0)?,
            content: row.get(1)?,
            date: row.get(2)?,
            answer: row.get::<_, Option<String>>(3)?.map(|_| Answer {
                content: row.get(3).unwrap(),
                date: row.get(4).unwrap(),
            }),
        })
    }
}

pub async fn questions(pool: &Pool, token: String) -> FallibleQuery<Vec<Question>> {
    let admin = is_admin(pool, token.clone()).await?;
    let conn = pool.get();
    web::block(move || -> Fallible<_> {
        let conn = conn?;
        let mut stmt = conn.prepare(
            "
            SELECT id, content, date, answer, answerDate
            FROM questions
            WHERE creator = ?1 OR ?2
            ORDER BY date",
        )?;
        stmt.query_map(params![token, admin], |row| Ok(Question::from_row(row)?))
            .and_then(Iterator::collect)
            .map_err(|e| e.into())
    })
    .await
    .map_err(|e| e.into())
}

pub async fn add_question(
    pool: &Pool,
    token: String,
    question: AskQuestion,
) -> FallibleQuery<Question> {
    let conn = pool.get();
    web::block(move || -> Fallible<_> {
        let conn = conn?;
        let mut stmt = conn.prepare(
            "
            INSERT INTO
                questions (content, creator)
            VALUES
                (?1, ?2)",
        )?;
        let id = stmt.insert(params![question.content, token])?;
        let mut stmt = conn.prepare(
            "
            SELECT id, content, date, answer, answerDate
            FROM questions
            WHERE id = ?1
            ORDER BY date",
        )?;
        let mut q = stmt.query_map(params![id], |row| Ok(Question::from_row(row)?))?;
        Ok(q.next().unwrap()?)
    })
    .await
    .map_err(|e| e.into())
}

pub async fn add_announcement(pool: &Pool, announcement: AddAnnouncement) -> FallibleQuery<()> {
    let conn = pool.get();
    web::block(move || -> Fallible<_> {
        let conn = conn?;
        let mut stmt = conn.prepare(
            "
            INSERT INTO
                announcements (severity, title, content, creator)
            VALUES
                (?1, ?2, ?3, ?4)",
        )?;
        stmt.insert(params![
            announcement.severity,
            announcement.title,
            announcement.content,
            announcement.token
        ])?;
        Ok(())
    })
    .await
    .map_err(|e| e.into())
}

pub async fn is_admin(pool: &Pool, token: String) -> FallibleQuery<bool> {
    let conn = pool.get();
    web::block(move || -> Fallible<_> {
        let conn = conn?;
        let mut stmt = conn.prepare(
            "
            SELECT isAdmin
            FROM users
            WHERE token = ?1",
        )?;
        let mut res = stmt.query_map(params![token], |row| Ok(row.get::<_, i32>(0)? == 1))?;
        let admin = match res.next() {
            Some(Ok(admin)) => admin,
            _ => false,
        };
        if res.next().is_some() {
            return Ok(false);
        }

        Ok(admin)
    })
    .await
    .map_err(|e| e.into())
}

pub async fn answer_question(
    pool: &Pool,
    token: String,
    answer: AnswerQuestion,
) -> FallibleQuery<bool> {
    let conn = pool.get();
    web::block(move || -> Fallible<_> {
        let conn = conn?;
        let mut stmt = conn.prepare(
            "
            UPDATE
                questions
            SET
                answer = ?1,
                answerDate = CURRENT_TIMESTAMP,
                answerer = ?2
            WHERE
                id = ?3",
        )?;
        let res = stmt.execute(params![answer.content, token, answer.id])?;
        Ok(res == 1)
    })
    .await
    .map_err(|e| e.into())
}
