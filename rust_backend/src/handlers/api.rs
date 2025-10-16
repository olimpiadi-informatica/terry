use std::collections::HashMap;
use std::ops::Range;

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

use crate::checker_api::{Feedback, Subtask, Validation};
use crate::models::{Announcement, Question, Role, Task};
use crate::serve::ExtraMaterialSection;

#[derive(Debug, Deserialize)]
pub struct AddAnnouncementRequest {
    pub severity: String,
    pub title: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct CommunicationList {
    pub announcements: Vec<Announcement>,
    pub questions: Vec<Question>,
}

#[derive(Deserialize)]
pub struct SubmitRequest {
    pub output_id: String,
    pub source_id: String,
}

#[derive(Debug, Serialize)]
pub struct Input {
    #[serde(flatten)]
    pub input: crate::models::Input,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub expiry_date: Option<DateTime<Utc>>,
}

#[derive(Debug, Serialize)]
pub struct Output {
    #[serde(flatten)]
    pub output: crate::models::Output,
    pub validation: Validation,
}

#[derive(Debug, Serialize)]
pub struct Source {
    #[serde(flatten)]
    pub source: crate::models::Source,
    pub validation: Validation,
}

#[derive(Debug, Serialize)]
pub struct Submission {
    pub id: String,
    pub token: String,
    pub task: String,
    pub score: f64,
    pub date: DateTime<Utc>,
    pub feedback: Feedback,
    pub input: Input,
    pub output: Output,
    pub source: Source,
    pub subtasks: Vec<Subtask>,
}

#[derive(Debug, Serialize)]
pub struct UserTaskInfo {
    pub name: String,
    pub score: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub current_input: Option<Input>,
}

#[derive(Debug, Serialize)]
pub struct UserStatus {
    pub token: String,
    pub name: String,
    pub surname: String,
    pub sso_user: bool,
    pub contest_start_delay: Option<i64>,
    pub tasks: HashMap<String, UserTaskInfo>,
    pub role: Role,
    pub total_score: f64,
    pub extra_time: i64,
}

#[derive(Debug, Serialize)]
pub struct ContestStatus {
    pub has_started: bool,
    pub time: Range<DateTime<Utc>>,
    pub name: String,
    pub description: String,
    pub extra_material: Vec<ExtraMaterialSection>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tasks: Option<Vec<Task>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub max_total_score: Option<f64>,
}

#[derive(Debug, Serialize)]
pub struct StatusResponse {
    pub user: Option<UserStatus>,
    pub contest: ContestStatus,
}
