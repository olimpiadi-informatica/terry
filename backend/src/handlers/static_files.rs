use std::path::{Component, PathBuf};

use axum::extract::{Path, State};
use axum::response::IntoResponse;
use axum_extra::response::Attachment;
use tokio::fs;

use super::ApiError;
use crate::extractors::EnsureUserContestStarted;
use crate::serve::AppState;

pub async fn serve_file_with_attachment(
    Path(path): Path<String>,
) -> Result<Attachment<Vec<u8>>, ApiError> {
    let safe_path = sanitize_path(&path);
    let file_path = PathBuf::from("./files/").join(safe_path);

    if !file_path.exists() {
        return Err(ApiError::BadRequest("File not found".to_string()));
    }

    let filename = file_path.file_name().unwrap().to_str().unwrap().to_string();
    let content = fs::read(file_path).await?;

    Ok(Attachment::new(content).filename(filename))
}

fn sanitize_path(path: &str) -> PathBuf {
    let mut sanitized = PathBuf::new();
    for component in PathBuf::from(path).components() {
        if let Component::Normal(name) = component {
            sanitized.push(name);
        }
    }
    sanitized
}

pub async fn serve_statement(
    State(_state): State<AppState>,
    Path((task, path)): Path<(String, String)>,
    _ensure_user_contest_started: EnsureUserContestStarted,
) -> Result<impl IntoResponse, ApiError> {
    let safe_path = sanitize_path(&path);
    let file_path = PathBuf::from("./contest/")
        .join(&task)
        .join("statement")
        .join(safe_path);

    if !file_path.exists() {
        return Err(ApiError::Forbidden("Statement not found".to_string()));
    }

    let filename = file_path.file_name().unwrap().to_str().unwrap().to_string();
    let content = fs::read(file_path).await?;

    Ok(Attachment::new(content).filename(filename))
}
