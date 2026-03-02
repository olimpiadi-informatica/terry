use chrono::{DateTime, Utc};
use clap::ValueEnum;
use derive_more::Display;
use serde::{Deserialize, Serialize};

use crate::checker_api::CheckerResult;

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::Type, PartialEq, Eq, ValueEnum, Display)]
#[sqlx(type_name = "TEXT", rename_all = "PascalCase")]
pub enum Role {
    Admin,
    Contestant,
    Unofficial,
}

impl Default for Role {
    fn default() -> Self {
        Role::Contestant
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub token: String,
    pub name: String,
    pub surname: String,
    pub extra_time: i64,
    pub sso_user: i64,
    pub contest_start_delay: Option<i64>,
    #[serde(default)]
    pub role: Role,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Announcement {
    pub id: i64,
    pub severity: String,
    pub title: String,
    pub content: String,
    pub date: DateTime<Utc>,
    pub creator: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct Question {
    pub id: i64,
    pub content: String,
    pub creator: String,
    pub date: DateTime<Utc>,
    pub answer: Option<String>,
    pub answerer: Option<String>,
    pub answer_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Task {
    pub name: String,
    pub title: String,
    pub statement_path: String,
    pub max_score: f64,
    pub num: i64,
    pub submission_timeout: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Input {
    pub id: String,
    pub token: String,
    pub task: String,
    pub attempt: i64,
    pub date: DateTime<Utc>,
    pub path: String,
    pub size: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Source {
    pub id: String,
    pub input: String,
    pub date: DateTime<Utc>,
    pub path: String,
    pub size: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Output {
    pub id: String,
    pub input: String,
    pub date: DateTime<Utc>,
    pub path: String,
    pub size: i64,
    pub result: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UserTask {
    pub token: String,
    pub task: String,
    pub score: f64,
    pub current_attempt: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct SubmissionFull {
    pub id: String,
    pub token: String,
    pub task: String,
    pub score: f64,
    pub submission_date: DateTime<Utc>,
    pub input_id: String,
    pub input_attempt: i64,
    pub input_date: DateTime<Utc>,
    pub input_path: String,
    pub input_size: i64,
    pub output_id: String,
    pub output_date: DateTime<Utc>,
    pub output_path: String,
    pub output_size: i64,
    pub output_result: CheckerResult,
    pub source_id: String,
    pub source_date: DateTime<Utc>,
    pub source_path: String,
    pub source_size: i64,
}
