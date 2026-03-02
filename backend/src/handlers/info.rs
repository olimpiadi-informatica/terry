use std::path::PathBuf;
use std::sync::Arc;
use std::time::{Duration, Instant};

use axum::Json;
use axum::extract::{Path, State};
use tokio::sync::RwLock;
use tracing::{info, warn};

use super::ApiError;
use super::api::{ContestStatus, StatusResponse, Submission};
use crate::config::Config;
use crate::database;
use crate::extractors::{AuthUser, EnsureUserContestStarted};
use crate::serve::{AppState, ExtraMaterialSection};

const CACHE_DURATION: Duration = Duration::from_secs(5);

async fn read_markdown_file(path: &Option<PathBuf>) -> Option<String> {
    if let Some(p) = path {
        match tokio::fs::read_to_string(p).await {
            Ok(content) => Some(content),
            Err(e) => {
                warn!("Failed to read markdown file {:?}: {}", p, e);
                None
            }
        }
    } else {
        None
    }
}

#[derive(Default)]
struct CachedValue<T> {
    value: T,
    last_updated: Option<Instant>,
}

impl<T> CachedValue<T> {
    fn is_stale(&self) -> bool {
        self.last_updated
            .is_none_or(|l| l.elapsed() > CACHE_DURATION)
    }
}

async fn get_cached_value<T: Clone>(
    cv_lock: &RwLock<CachedValue<T>>,
    read: impl AsyncFnOnce() -> T,
) -> T {
    let mut cv = cv_lock.read().await;
    if cv.is_stale() {
        drop(cv);
        {
            let mut cw = cv_lock.write().await;
            if cw.is_stale() {
                cw.value = read().await;
                cw.last_updated = Some(Instant::now());
            }
        }
        cv = cv_lock.read().await;
    }
    cv.value.clone()
}

#[derive(Clone, Default)]
pub struct CachedData {
    public_description: Arc<RwLock<CachedValue<String>>>,
    extra_material: Arc<RwLock<CachedValue<Vec<ExtraMaterialSection>>>>,
    contest_description: Arc<RwLock<CachedValue<String>>>,
}

impl CachedData {
    async fn public_description(&self, config: &Config) -> String {
        get_cached_value(&self.public_description, async || {
            read_markdown_file(&config.public_description)
                .await
                .unwrap_or_default()
        })
        .await
    }
    async fn contest_description(&self, config: &Config) -> String {
        get_cached_value(&self.contest_description, async || {
            read_markdown_file(&config.contest_description)
                .await
                .unwrap_or_default()
        })
        .await
    }

    async fn extra_material(&self, config: &Config) -> Vec<ExtraMaterialSection> {
        get_cached_value(&self.extra_material, async || {
            let mut loaded_sections = vec![];
            for section in &config.extra_material {
                let content = read_markdown_file(&Some(section.page.clone())).await;
                if let Some(page) = content {
                    loaded_sections.push(ExtraMaterialSection {
                        name: section.name.clone(),
                        url: section.url.clone(),
                        page,
                    });
                }
            }
            loaded_sections
        })
        .await
    }
}

pub async fn get_status(
    State(state): State<AppState>,
    user: Option<AuthUser>,
) -> Result<Json<StatusResponse>, ApiError> {
    let user = user.as_deref();
    if let Some(user) = user {
        info!("Getting contest status for {}", user.token);
    } else {
        info!("Getting general contest status");
    };

    let contest_started_for_user = match (user, state.config.window_duration) {
        (None, _) => false,
        (Some(u), Some(_)) => u.contest_start_delay.is_some(),
        (Some(_), None) => chrono::Utc::now() >= state.config.start_time,
    };

    let user_status = if let Some(u) = user {
        Some(super::get_user_status(&state.pool, u.clone()).await?)
    } else {
        None
    };

    let end_time = {
        let contest_end = state.config.start_time + state.config.contest_duration;
        if let Some(user) = &user {
            let end = if let (Some(window_duration), Some(start_delay)) =
                (state.config.window_duration, user.contest_start_delay)
            {
                let window_end = state.config.start_time
                    + chrono::Duration::seconds(start_delay)
                    + window_duration
                    + chrono::Duration::seconds(user.extra_time);
                std::cmp::min(contest_end, window_end)
            } else {
                contest_end
            };
            end + chrono::Duration::seconds(user.extra_time)
        } else {
            contest_end
        }
    };

    let description = if contest_started_for_user {
        state.cached_data.contest_description(&state.config).await
    } else {
        state.cached_data.public_description(&state.config).await
    };

    let mut contest_status = ContestStatus {
        has_started: contest_started_for_user,
        time: state.config.start_time..end_time,
        name: state.config.contest_name.clone(),
        description,
        extra_material: state.cached_data.extra_material(&state.config).await,
        tasks: None,
        max_total_score: None,
    };

    if contest_started_for_user {
        let tasks = database::get_tasks(&state.pool).await?;
        contest_status.max_total_score = Some(tasks.iter().map(|x| x.max_score).sum::<f64>());
        contest_status.tasks = Some(tasks);
    }

    Ok(Json(StatusResponse {
        user: user_status,
        contest: contest_status,
    }))
}

/*
pub async fn get_input(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(input_id): Path<String>,
    _ensure_user_contest_started: EnsureUserContestStarted,
) -> Result<Json<Input>, ApiError> {
    info!("Getting input {}", input_id);
    let input = database::get_input_by_id(&state.pool, &input_id)
        .await?
        .ok_or_else(|| ApiError::NotFound("Input not found".to_string()))?;

    // Check if the user requesting matches the input's token
    if user.token != input.token {
        return Err(ApiError::Forbidden(
            "You can only view your own inputs".to_string(),
        ));
    }

    Ok(Json(get_api_input(&state.pool, input).await?))
}

pub async fn get_output(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(output_id): Path<String>,
    _ensure_user_contest_started: EnsureUserContestStarted,
) -> Result<Json<Output>, ApiError> {
    let output = database::get_output(&state.pool, &output_id)
        .await?
        .ok_or_else(|| ApiError::NotFound("Output not found".to_string()))?;

    info!("Getting output {}", output.id);

    // Check if the user requesting matches the output's input token
    let input = database::get_input_by_id(&state.pool, &output.input)
        .await?
        .expect("Input not found for output");

    if user.token != input.token {
        return Err(ApiError::Forbidden(
            "You can only view your own outputs".to_string(),
        ));
    }

    Ok(Json(response))
}

pub async fn get_source(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(source_id): Path<String>,
    _ensure_user_contest_started: EnsureUserContestStarted,
) -> Result<Json<crate::models::Source>, ApiError> {
    let source = database::get_source(&state.pool, &source_id)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .ok_or_else(|| ApiError::NotFound("Source not found".to_string()))?;

    info!("Getting source {}", source.id);
    // Check if the user requesting matches the source's input token
    let input = database::get_input(&state.pool, Some(&source.input), None, None, None)
        .await
        .map_err(|e| ApiError::Internal(e.to_string()))?
        .ok_or_else(|| ApiError::Internal("Input not found for source".to_string()))?;

    if user.token != input.token {
        return Err(ApiError::Forbidden(
            "You can only view your own sources".to_string(),
        ));
    }

    Ok(Json(source))
}
*/

pub async fn get_submission(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(submission_id): Path<String>,
    _ensure_user_contest_started: EnsureUserContestStarted,
) -> Result<Json<Submission>, ApiError> {
    let submission = database::get_submission(&state.pool, &submission_id)
        .await?
        .ok_or_else(|| ApiError::NotFound("Submission not found".to_string()))?;

    info!("Getting submission {}", submission.id);

    // Check if the user requesting matches the submission's token
    if user.token != submission.token {
        return Err(ApiError::Forbidden(
            "You can only view your own submissions".to_string(),
        ));
    }

    Ok(Json(submission.into()))
}

pub async fn get_submissions(
    State(state): State<AppState>,
    AuthUser(user): AuthUser,
    Path(task_name): Path<String>,
    _ensure_user_contest_started: EnsureUserContestStarted,
) -> Result<Json<Vec<Submission>>, ApiError> {
    info!(
        "Getting submissions for token {} and task {}",
        user.token, task_name
    );

    let submissions = database::get_submissions(&state.pool, &user.token, &task_name).await?;
    Ok(Json(submissions.into_iter().map(|x| x.into()).collect()))
}
