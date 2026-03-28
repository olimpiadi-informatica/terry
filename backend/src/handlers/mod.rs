use std::collections::HashMap;
use std::fmt::{self, Display};
use std::string::FromUtf8Error;

use api::{Input, Output, Source, Submission, UserStatus, UserTaskInfo};
use axum::Json;
use axum::extract::multipart::MultipartError;
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use color_eyre::eyre::{Report, Result};
use serde_json::json;
use sqlx::SqlitePool;
use tracing::warn;

use crate::checker_api::Validation;
use crate::database;
use crate::models::{SubmissionFull, User};

pub mod admin;
pub mod api;
pub mod auth;
pub mod communication;
pub mod contest;
pub mod info;
pub mod proxy;
pub mod static_files;
pub mod upload;

#[derive(Debug)]
pub enum ApiError {
    Forbidden(String),
    BadRequest(String),
    Internal(String),
    NotFound(String),
}

impl Display for ApiError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            ApiError::Forbidden(msg) => write!(f, "Forbidden: {}", msg),
            ApiError::BadRequest(msg) => write!(f, "Bad Request: {}", msg),
            ApiError::Internal(msg) => write!(f, "Internal Error: {}", msg),
            ApiError::NotFound(msg) => write!(f, "Not Found: {}", msg),
        }
    }
}

impl std::error::Error for ApiError {}

impl From<Report> for ApiError {
    fn from(err: Report) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl From<serde_json::Error> for ApiError {
    fn from(err: serde_json::Error) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl From<csv::Error> for ApiError {
    fn from(err: csv::Error) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl From<sqlx::Error> for ApiError {
    fn from(err: sqlx::Error) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for ApiError {
    fn from(err: jsonwebtoken::errors::Error) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl From<std::io::Error> for ApiError {
    fn from(err: std::io::Error) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl From<MultipartError> for ApiError {
    fn from(err: MultipartError) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl From<FromUtf8Error> for ApiError {
    fn from(err: FromUtf8Error) -> Self {
        ApiError::Internal(err.to_string())
    }
}

impl IntoResponse for ApiError {
    fn into_response(self) -> Response {
        let (status, code, message) = match self {
            ApiError::Forbidden(msg) => (StatusCode::FORBIDDEN, "FORBIDDEN", msg),
            ApiError::BadRequest(msg) => (StatusCode::BAD_REQUEST, "BAD_REQUEST", msg),
            ApiError::Internal(msg) => (StatusCode::INTERNAL_SERVER_ERROR, "INTERNAL_ERROR", msg),
            ApiError::NotFound(msg) => (StatusCode::NOT_FOUND, "NOT_FOUND", msg),
        };

        warn!("{}: {}", code, message);

        let body = Json(json!({
            "code": code,
            "message": message,
        }));

        (status, body).into_response()
    }
}

async fn get_user_status(db: &SqlitePool, user: User) -> Result<UserStatus, ApiError> {
    let tasks = database::get_user_tasks(db, &user.token).await?;
    let mut task_info = HashMap::new();
    let mut total_score = 0.0;
    for t in tasks.into_iter() {
        let mut user_ti = UserTaskInfo {
            name: t.task.clone(),
            score: t.score,
            current_input: None,
        };
        total_score += t.score;
        if let Some(i) = t.current_attempt {
            user_ti.current_input = Some(
                get_api_input(
                    db,
                    database::get_input(db, &t.token, &t.task, i)
                        .await?
                        .unwrap(),
                )
                .await?,
            );
        }
        task_info.insert(t.task, user_ti);
    }
    Ok(UserStatus {
        token: user.token,
        name: user.name,
        surname: user.surname,
        sso_user: user.sso_user != 0,
        contest_start_delay: user.contest_start_delay,
        role: user.role,
        tasks: task_info,
        total_score,
        extra_time: user.extra_time,
    })
}

async fn get_api_input(db: &SqlitePool, input: crate::models::Input) -> Result<Input> {
    let task = database::get_task(db, &input.task)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .ok_or_else(|| ApiError::Internal("Task not found for input".to_string()))?;

    let expiry_date = task
        .submission_timeout
        .map(|timeout| input.date + chrono::Duration::seconds(timeout));

    Ok(Input { input, expiry_date })
}

impl From<SubmissionFull> for Submission {
    fn from(submission: SubmissionFull) -> Submission {
        let checker_result = submission.output_result;
        let feedback = checker_result.feedback;
        let subtasks = checker_result.subtasks;
        let validation = checker_result.validation;

        let output = Output {
            output: crate::models::Output {
                id: submission.output_id,
                date: submission.output_date,
                path: submission.output_path,
                size: submission.output_size,
                input: submission.input_id.clone(),
                result: String::new(),
            },
            validation,
        };

        let input = Input {
            input: crate::models::Input {
                id: submission.input_id.clone(),
                token: submission.token.clone(),
                task: submission.task.clone(),
                attempt: submission.input_attempt,
                date: submission.input_date,
                path: submission.input_path,
                size: submission.input_size,
            },
            expiry_date: None, // Not relevant if already submitted.
        };

        let source = Source {
            source: crate::models::Source {
                id: submission.source_id,
                input: submission.input_id,
                date: submission.input_date,
                path: submission.source_path,
                size: submission.source_size,
            },
            validation: Validation {
                cases: vec![],
                alerts: vec![],
            },
        };

        Submission {
            id: submission.id,
            token: submission.token,
            task: submission.task,
            score: submission.score,
            date: submission.submission_date,
            feedback,
            input,
            output,
            source,
            subtasks: subtasks.unwrap_or_default(),
        }
    }
}
