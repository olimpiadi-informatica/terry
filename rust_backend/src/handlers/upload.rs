use axum::Json;
use axum::extract::{Multipart, Path, State};
use tracing::info;

use super::ApiError;
use super::api::{Output, Source};
use crate::checker_api::{Alert, AlertSeverity, CheckerResult, Validation};
use crate::detect_exe::get_exeflags;
use crate::extractors::{AuthUser, EnsureContestRunning};
use crate::serve::AppState;
use crate::{database, storage_manager};

pub async fn upload_output(
    State(state): State<AppState>,
    _ensure_contest_running: EnsureContestRunning,
    AuthUser(user): AuthUser,
    Path(input_id): Path<String>,
    mut multipart: Multipart,
) -> Result<Json<Output>, ApiError> {
    info!("Uploading output for input {}", input_id);
    let input = database::get_input_by_id(&state.pool, &input_id)
        .await?
        .ok_or_else(|| ApiError::NotFound("Input not found".to_string()))?;

    // Check if the user uploading matches the input's token
    if user.token != input.token {
        return Err(ApiError::Forbidden(
            "You can only upload outputs for your own inputs".to_string(),
        ));
    }

    let (file_name, content) = if let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
    {
        let name = field.file_name().unwrap_or("output.txt").to_string();
        let content = field.bytes().await?;
        (name, content)
    } else {
        return Err(ApiError::BadRequest("Missing file part".to_string()));
    };

    let output_id = database::gen_id();
    let path = storage_manager::new_output_file(&output_id, &file_name)
        .map_err(|_| ApiError::BadRequest("Invalid filename".to_string()))?;
    storage_manager::save_file(&path, &content).await?;
    let file_size = content.len() as i64;

    let input_path = std::path::PathBuf::from(&input.path);
    let result_bytes = state
        .contest_manager
        .evaluate_output(&input.task, &input_path, &path)
        .await?;
    let result_str = String::from_utf8(result_bytes)?;

    database::add_output(
        &state.pool,
        &output_id,
        &input.id,
        path.to_str().unwrap(),
        file_size,
        &result_str,
    )
    .await?;

    let output = database::get_output(&state.pool, &output_id)
        .await?
        .unwrap();
    let checker_result: CheckerResult = serde_json::from_str(&output.result)?;
    let validation = checker_result.validation;
    Ok(Json(Output {
        validation,
        output: crate::models::Output {
            result: String::new(),
            ..output
        },
    }))
}

pub async fn upload_source(
    State(state): State<AppState>,
    _ensure_contest_running: EnsureContestRunning,
    AuthUser(user): AuthUser,
    Path(input_id): Path<String>,
    mut multipart: Multipart,
) -> Result<Json<Source>, ApiError> {
    info!("Uploading source for input {}", input_id);
    let input = database::get_input_by_id(&state.pool, &input_id)
        .await?
        .ok_or_else(|| ApiError::NotFound("Input not found".to_string()))?;

    // Check if the user uploading matches the input's token
    if user.token != input.token {
        return Err(ApiError::Forbidden(
            "You can only upload sources for your own inputs".to_string(),
        ));
    }

    let (file_name, content) = if let Some(field) = multipart
        .next_field()
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
    {
        let name = field.file_name().unwrap_or("source.txt").to_string();
        let content = field.bytes().await?;
        (name, content)
    } else {
        return Err(ApiError::BadRequest("Missing file part".to_string()));
    };

    let mut alerts = Vec::new();
    if !get_exeflags(&content).is_empty() {
        alerts.push(Alert {
            severity: AlertSeverity::Warning,
            message: "You have submitted an executable! Please send the source code.".to_string(),
        });
    }

    if state
        .contest_manager
        .is_statement_file(&input.task, &content)
        .await?
    {
        alerts.push(Alert {
            severity: AlertSeverity::Warning,
            message: "You have submitted a template file! Please send the source code.".to_string(),
        });
    }

    if alerts.is_empty() {
        alerts.push(Alert {
            severity: AlertSeverity::Warning,
            message: "Source file uploaded correctly.".to_string(),
        });
    }

    let source_id = database::gen_id();
    let path = storage_manager::new_source_file(&source_id, &file_name)
        .map_err(|_| ApiError::BadRequest("Invalid filename".to_string()))?;
    storage_manager::save_file(&path, &content).await?;
    let file_size = content.len() as i64;

    database::add_source(
        &state.pool,
        &source_id,
        &input.id,
        path.to_str().unwrap(),
        file_size,
    )
    .await?;

    let source = database::get_source(&state.pool, &source_id)
        .await?
        .unwrap();

    Ok(Json(Source {
        source,
        validation: Validation {
            alerts,
            cases: vec![],
        },
    }))
}
