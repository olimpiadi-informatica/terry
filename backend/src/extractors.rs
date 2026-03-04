use std::ops::Deref;

use axum::extract::{FromRequestParts, OptionalFromRequestParts};
use axum::http::request::Parts;
use axum_extra::extract::cookie::CookieJar;
use chrono::{Duration, Utc};
use color_eyre::eyre::Result;
use jsonwebtoken::{Algorithm, DecodingKey, Validation, decode};
use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;
use tracing::{info, warn};

use crate::config::Config;
use crate::database;
use crate::handlers::ApiError;
use crate::models::{Role, User};
use crate::serve::AppState;

#[derive(Debug, Deserialize, Clone, Serialize)]
pub struct SsoPayload {
    pub token: String,
    #[serde(rename = "firstName")]
    pub first_name: Option<String>,
    #[serde(rename = "lastName")]
    pub last_name: Option<String>,
    pub exp: usize,
}

pub fn decode_jwt_and_get_payload(jwt: &str, secret: &str) -> Result<SsoPayload, ApiError> {
    let decoding_key = DecodingKey::from_secret(secret.as_bytes());
    let mut validation = Validation::new(Algorithm::HS256);
    validation.validate_exp = true;

    let token_data = decode::<SsoPayload>(jwt, &decoding_key, &validation).map_err(|e| {
        warn!("JWT decoding failed: {}", e);
        ApiError::Forbidden("Invalid or expired token".to_string())
    })?;

    Ok(token_data.claims)
}

/// Makes sure that the window of the user has been started.
/// Returns true if the user has been updated.
pub async fn ensure_window_start(
    pool: &SqlitePool,
    config: &Config,
    token: &str,
) -> Result<bool, ApiError> {
    if config.window_duration.is_none() {
        return Ok(false);
    }
    let user = match database::get_user(pool, token).await? {
        Some(u) => u,
        None => return Ok(false), // User not found, can't start window.
    };
    if user.contest_start_delay.is_some() {
        return Ok(false);
    }

    let now = Utc::now();
    if now < config.start_time {
        return Ok(false); // contest not started, can't start window
    }

    let delay = (now - config.start_time).num_seconds();
    if delay < 0 {
        return Ok(false);
    }

    database::set_start_delay(pool, token, delay).await?;
    info!("Window started for user {} with delay {}s", token, delay);
    Ok(true)
}

pub struct AuthUser(pub User);

impl Deref for AuthUser {
    type Target = User;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl OptionalFromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Option<Self>, Self::Rejection> {
        let jar = CookieJar::from_request_parts(parts, state).await.unwrap();

        let Some(jwt_token) = jar.get(&state.config.jwt_cookie_name) else {
            return Ok(None);
        };
        let jwt_token_str = jwt_token.value().to_string();

        let config = &state.config;
        let pool = &state.pool;

        let payload = decode_jwt_and_get_payload(&jwt_token_str, &config.jwt_secret)?;

        let mut user = database::get_user(pool, &payload.token)
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;

        if user.is_none() {
            // User not in DB. Create if SSO is configured.
            if config.sso_url.is_some() {
                // Create user
                let mut tx = pool
                    .begin()
                    .await
                    .map_err(|e| ApiError::Internal(e.to_string()))?;

                let name = payload
                    .first_name
                    .clone()
                    .unwrap_or_else(|| payload.token.clone());
                let surname = payload.last_name.clone().unwrap_or_default();

                database::add_user(
                    &mut *tx,
                    &payload.token,
                    &name,
                    &surname,
                    true,
                    &crate::models::Role::Contestant,
                )
                .await
                .map_err(|e| ApiError::Internal(e.to_string()))?;

                tx.commit()
                    .await
                    .map_err(|e| ApiError::Internal(e.to_string()))?;

                info!("User {} created from SSO", payload.token);

                user = database::get_user(pool, &payload.token)
                    .await
                    .map_err(|e| ApiError::Internal(e.to_string()))?;
            } else {
                return Err(ApiError::Forbidden("No such user".to_string()));
            }
        }

        let mut user_to_return = user
            .ok_or_else(|| ApiError::Internal("Failed to fetch user after creation".to_string()))?;

        // Update user info if SSO user
        let current_first_name = payload
            .first_name
            .clone()
            .unwrap_or_else(|| payload.token.clone());
        let current_last_name = payload.last_name.clone().unwrap_or_default();

        if user_to_return.sso_user != 0
            && (user_to_return.name != current_first_name
                || user_to_return.surname != current_last_name)
        {
            database::update_user_info(
                pool,
                &payload.token,
                &current_first_name,
                &current_last_name,
            )
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?;
            user_to_return.name = current_first_name;
            user_to_return.surname = current_last_name;
        }

        if ensure_window_start(pool, config, &user_to_return.token)
            .await
            .map_err(|e| ApiError::Internal(e.to_string()))?
        {
            user_to_return = database::get_user(pool, &user_to_return.token)
                .await
                .map_err(|e| ApiError::Internal(e.to_string()))?
                .ok_or_else(|| {
                    ApiError::Internal("Failed to re-fetch user after window start".to_string())
                })?;
        }

        Ok(Some(AuthUser(user_to_return)))
    }
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let user = <Self as OptionalFromRequestParts<_>>::from_request_parts(parts, state).await?;
        user.ok_or_else(|| ApiError::Forbidden("Missing JWT cookie".to_string()))
    }
}

pub struct EnsureUserContestStarted;

impl FromRequestParts<AppState> for EnsureUserContestStarted {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let AuthUser(user) =
            <AuthUser as FromRequestParts<_>>::from_request_parts(parts, state).await?;

        if user.role == Role::Admin {
            return Ok(EnsureUserContestStarted);
        }

        if state.config.window_duration.is_some() {
            if user.contest_start_delay.is_none() {
                return Err(ApiError::Forbidden(
                    "The contest has not started yet".to_string(),
                ));
            }
        } else if chrono::Utc::now() < state.config.start_time {
            return Err(ApiError::Forbidden(
                "The contest has not started yet".to_string(),
            ));
        }
        Ok(EnsureUserContestStarted)
    }
}

pub struct EnsureContestRunning;

impl FromRequestParts<AppState> for EnsureContestRunning {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let AuthUser(user) =
            <AuthUser as FromRequestParts<_>>::from_request_parts(parts, state).await?;
        if user.role == Role::Admin {
            return Ok(EnsureContestRunning);
        }

        if state.config.window_duration.is_some() {
            if user.contest_start_delay.is_none() {
                return Err(ApiError::Forbidden(
                    "The contest has not started yet".to_string(),
                ));
            }
        } else if chrono::Utc::now() < state.config.start_time {
            return Err(ApiError::Forbidden(
                "The contest has not started yet".to_string(),
            ));
        }

        let now = chrono::Utc::now();
        let extra_time = user.extra_time;

        let contest_end =
            state.config.start_time + state.config.contest_duration + Duration::seconds(extra_time);
        if now > contest_end {
            return Err(ApiError::Forbidden("The contest has ended".to_string()));
        }

        if let Some(window_duration) = state.config.window_duration {
            if let Some(start_delay) = user.contest_start_delay {
                let window_end = state.config.start_time
                    + Duration::seconds(start_delay)
                    + window_duration
                    + Duration::seconds(extra_time);
                if now > window_end {
                    return Err(ApiError::Forbidden("Your window has ended".to_string()));
                }
            }
        }
        Ok(EnsureContestRunning)
    }
}

pub struct Admin(User);

impl Deref for Admin {
    type Target = User;
    fn deref(&self) -> &Self::Target {
        &self.0
    }
}

impl FromRequestParts<AppState> for Admin {
    type Rejection = ApiError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let AuthUser(user) =
            <AuthUser as FromRequestParts<_>>::from_request_parts(parts, state).await?;
        if user.role != Role::Admin {
            return Err(ApiError::Forbidden("You are not an admin".to_string()));
        }

        Ok(Admin(user))
    }
}
