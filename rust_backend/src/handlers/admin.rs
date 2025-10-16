use axum::Json;
use axum::extract::{Path, State};
use tracing::info;

use super::ApiError;
use super::api::{AddAnnouncementRequest, UserStatus};
use crate::database;
use crate::extractors::Admin;
use crate::models::Question;
use crate::serve::AppState;

// TODO(veluca): Json<(i64,)> is a hack.
pub async fn set_extra_time(
    State(state): State<AppState>,
    _: Admin,
    Path(token): Path<String>,
    Json((seconds,)): Json<(i64,)>,
) -> Result<(), ApiError> {
    info!("Setting extra time {seconds}s for {}", token);
    database::set_extra_time(&state.pool, &token, seconds).await?;
    Ok(())
}

pub async fn user_list(
    State(state): State<AppState>,
    _: Admin,
) -> Result<Json<Vec<UserStatus>>, ApiError> {
    info!("Listing users");
    let users = database::get_users(&state.pool).await?;
    let mut resp = vec![];
    for u in users {
        resp.push(super::get_user_status(&state.pool, u).await?);
    }
    Ok(Json(resp))
}

pub async fn questions(
    State(state): State<AppState>,
    _: Admin,
) -> Result<Json<Vec<Question>>, ApiError> {
    info!("Listing all questions");
    Ok(Json(database::get_all_questions(&state.pool).await?))
}

pub async fn answer_question(
    State(state): State<AppState>,
    admin: Admin,
    Path(id): Path<i64>,
    answer: String,
) -> Result<Json<()>, ApiError> {
    let num_affected = database::answer_question(&state.pool, id, &answer, &admin.token).await?;
    if num_affected == 0 {
        return Err(ApiError::NotFound("No such question".to_string()));
    }
    Ok(Json(()))
}

pub async fn add_announcement(
    State(state): State<AppState>,
    admin: Admin,
    Json(payload): Json<AddAnnouncementRequest>,
) -> Result<Json<()>, ApiError> {
    database::add_announcement(
        &state.pool,
        &payload.severity,
        &payload.title,
        &payload.content,
        &admin.token,
    )
    .await?;
    Ok(Json(()))
}
