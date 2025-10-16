use axum::Json;
use axum::extract::State;
use axum::response::IntoResponse;
use axum_extra::extract::cookie::{Cookie, CookieJar};
use jsonwebtoken::{EncodingKey, Header, encode};
use time::OffsetDateTime;
use tracing::info;

use crate::database;
use crate::extractors::SsoPayload;
use crate::handlers::ApiError;
use crate::serve::AppState;

pub async fn login(
    State(state): State<AppState>,
    cookies: CookieJar,
    token: String,
) -> impl IntoResponse {
    info!("Login attempt for user {}", token);

    let Some(user) = database::get_user(&state.pool, &token).await? else {
        return Err(ApiError::Forbidden("Invalid token".to_string()));
    };

    let claims = SsoPayload {
        token: token.clone(),
        first_name: Some(user.name),
        last_name: Some(user.surname),
        exp: (chrono::Utc::now() + chrono::Duration::days(30)).timestamp() as usize,
    };

    let jwt_token = encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(state.config.jwt_secret.as_bytes()),
    )?;

    let cookie = Cookie::build((state.config.jwt_cookie_name.clone(), jwt_token))
        .path("/")
        .http_only(true)
        .build();

    Ok((cookies.add(cookie), Json(())))
}

pub async fn logout(State(state): State<AppState>, mut jar: CookieJar) -> impl IntoResponse {
    info!("Logout attempt");

    let cookie = Cookie::build((state.config.jwt_cookie_name.clone(), ""))
        .path("/")
        .http_only(true)
        .expires(
            OffsetDateTime::from_unix_timestamp(
                (chrono::Utc::now() - chrono::Duration::days(1)).timestamp(),
            )
            .unwrap(),
        )
        .build();

    jar = jar.remove(cookie);

    (jar, Json("Logged out successfully".to_string()))
}
