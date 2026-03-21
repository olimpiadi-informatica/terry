use std::path::{Component, PathBuf};

use axum::extract::{Path, State};
use axum::response::IntoResponse;
use http::HeaderValue;
use tower::Service;
use tower_http::services::ServeFile;

use crate::extractors::EnsureUserContestStarted;
use crate::serve::AppState;

pub async fn serve_file_with_attachment(
    Path(path): Path<String>,
    request: axum::extract::Request,
) -> impl IntoResponse {
    let safe_path = sanitize_path(&path);
    let file_path = std::path::Path::new("./files/").join(safe_path);
    let filename = file_path.file_name().unwrap().to_str().unwrap().to_string();

    let mut inner_service = ServeFile::new(file_path);
    let Ok(mut response) = inner_service.call(request).await;

    response.headers_mut().insert(
        http::header::CACHE_CONTROL,
        HeaderValue::from_static("private, max-age=31536000, immutable"),
    );
    response.headers_mut().insert(
        http::header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!(r#"attachment; filename="{filename}""#)).unwrap(),
    );

    response
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
    request: axum::extract::Request,
) -> impl IntoResponse {
    let safe_path = sanitize_path(&path);
    let file_path = std::path::Path::new("./contest/")
        .join(&task)
        .join("statement")
        .join(safe_path);
    let filename = file_path.file_name().unwrap().to_str().unwrap().to_string();

    let mut inner_service = ServeFile::new(file_path);
    let Ok(mut response) = inner_service.call(request).await;

    response.headers_mut().insert(
        http::header::CACHE_CONTROL,
        HeaderValue::from_static("private, no-cache"),
    );
    response.headers_mut().insert(
        http::header::CONTENT_DISPOSITION,
        HeaderValue::from_str(&format!(r#"attachment; filename="{filename}""#)).unwrap(),
    );

    response
}
