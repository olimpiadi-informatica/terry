use axum::extract::{Json, Path, State};
use tracing::info;

use super::ApiError;
use super::api::{Input, Submission, SubmitRequest};
use crate::checker_api::CheckerResult;
use crate::extractors::{AuthUser, EnsureContestRunning};
use crate::serve::AppState;
use crate::{database, storage_manager};

async fn add_submission(
    pool: &sqlx::SqlitePool,
    input: &crate::models::Input,
    output_id: &str,
    source_id: &str,
    score: f64,
) -> Result<String, ApiError> {
    let mut tx = pool.begin_with("BEGIN IMMEDIATE").await?;

    let submission_id = database::gen_id();
    let submission_result = database::add_submission(
        &mut *tx,
        &submission_id,
        &input.id,
        output_id,
        source_id,
        score,
    )
    .await;

    if submission_result.is_err() {
        tx.rollback().await?;
        // TODO: check for UNIQUE constraint error to return ALREADY_SUBMITTED
        return Err(ApiError::Forbidden(
            "This input has already been submitted".to_string(),
        ));
    }

    if database::get_user_task(&mut *tx, &input.token, &input.task)
        .await?
        .unwrap()
        .score
        < score
    {
        database::set_user_score(&mut *tx, &input.token, &input.task, score).await?;
    }

    database::set_user_attempt(&mut *tx, &input.token, &input.task, None).await?;

    tx.commit().await?;

    Ok(submission_id)
}

pub async fn generate_input(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(task_name): Path<String>,
    _ensure_contest_running: EnsureContestRunning,
) -> Result<Json<Input>, ApiError> {
    let task = database::get_task(&state.pool, &task_name)
        .await?
        .ok_or_else(|| ApiError::NotFound("Task not found".to_string()))?;

    info!("Generating input for task {}", task.name);

    if database::get_user_task(&state.pool, &user.token, &task.name)
        .await?
        .and_then(|ut| ut.current_attempt)
        .is_some()
    {
        return Err(ApiError::Forbidden(
            "You already have a ready input!".to_string(),
        ));
    }

    let attempt = database::get_next_attempt(&state.pool, &user.token, &task.name).await?;

    let generated_input = state
        .contest_manager
        .get_input(&task.name, attempt as u32)
        .await?;

    let size = storage_manager::get_file_size(&generated_input.path).await? as i64;

    let mut tx = state.pool.begin_with("BEGIN IMMEDIATE").await?;

    database::add_input(
        &mut *tx,
        &generated_input.id,
        &user.token,
        &task.name,
        attempt,
        generated_input.path.to_str().unwrap(),
        size,
    )
    .await?;

    if database::get_user_task(&mut *tx, &user.token, &task.name)
        .await?
        .is_none()
    {
        database::add_user_task(&mut *tx, &user.token, &task.name).await?;
    }
    database::set_user_attempt(&mut *tx, &user.token, &task.name, Some(attempt)).await?;

    tx.commit().await?;

    let input = database::get_input_by_id(&state.pool, &generated_input.id)
        .await?
        .expect("Failed to retrieve generated input");

    let input = super::get_api_input(&state.pool, input).await?;

    Ok(Json(input))
}

fn compute_score(task: &crate::models::Task, result: &str) -> Result<f64, ApiError> {
    let checker_result: CheckerResult = serde_json::from_str(result)?;
    let percent = checker_result.score;
    Ok(task.max_score * percent)
}

pub async fn submit(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    _ensure_contest_running: EnsureContestRunning,
    Path(input_id): Path<String>,
    Json(payload): Json<SubmitRequest>,
) -> Result<Json<Submission>, ApiError> {
    info!(
        "Submitting output {} with source {}",
        payload.output_id, payload.source_id
    );

    let output = database::get_output(&state.pool, &payload.output_id)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Output not found".to_string()))?;

    let source = database::get_source(&state.pool, &payload.source_id)
        .await?
        .ok_or_else(|| ApiError::BadRequest("Source not found".to_string()))?;

    let input = database::get_input_by_id(&state.pool, &output.input)
        .await?
        .ok_or_else(|| ApiError::BadRequest("The provided input in invalid".to_string()))?;

    if input.id != input_id {
        return Err(ApiError::BadRequest("Input ID mismatch".to_string()));
    }

    // Check if the user submitting matches the input's token
    if user.token != input.token {
        return Err(ApiError::Forbidden(
            "You can only submit for your own inputs".to_string(),
        ));
    }

    if output.input != source.input {
        return Err(ApiError::Forbidden(
            "The provided pair of source-output is invalid".to_string(),
        ));
    }

    let task = database::get_task(&state.pool, &input.task)
        .await?
        .expect("Task not found for input");

    if let Some(timeout) = task.submission_timeout {
        let expiry_date = input.date + chrono::Duration::seconds(timeout);
        if chrono::Utc::now() > expiry_date {
            return Err(ApiError::Forbidden(
                "The input file has expired".to_string(),
            ));
        }
    }

    let score = compute_score(&task, &output.result)?;
    let submission_id = add_submission(&state.pool, &input, &output.id, &source.id, score).await?;

    let submission = database::get_submission(&state.pool, &submission_id)
        .await?
        .expect("Failed to retrieve new submission");

    Ok(Json(submission.into()))
}

pub async fn abandon_input(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    _ensure_contest_running: EnsureContestRunning,
    Path(input_id): Path<String>,
) -> Result<(), ApiError> {
    info!("Abandoning input {}", input_id);

    let input = database::get_input_by_id(&state.pool, &input_id)
        .await?
        .ok_or_else(|| ApiError::NotFound("Input not found".to_string()))?;

    if user.token != input.token {
        return Err(ApiError::Forbidden(
            "You can only abandon your own inputs".to_string(),
        ));
    }

    database::set_user_attempt(&state.pool, &input.token, &input.task, None).await?;

    Ok(())
}
