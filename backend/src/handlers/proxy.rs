use axum::body::Body;
use axum::extract::{OptionalFromRequestParts, Request, State};
use axum::response::IntoResponse;
use http::header::Entry;
use http::{HeaderValue, StatusCode, Uri};
use hyper_util::client::legacy::Client;
use hyper_util::client::legacy::connect::HttpConnector;
use tracing::{error, warn};

use crate::extractors::AuthUser;
use crate::handlers::ApiError;
use crate::serve::AppState;

const AUTH_HEADER: &str = "X-OII-AUTH";

#[derive(Clone)]
pub struct ProxyState {
    pub app: AppState,
    pub http_client: Client<HttpConnector, Body>,
    pub upstream: Uri,
}

impl OptionalFromRequestParts<ProxyState> for AuthUser {
    type Rejection = ApiError;

    fn from_request_parts(
        parts: &mut http::request::Parts,
        state: &ProxyState,
    ) -> impl Future<Output = Result<Option<Self>, Self::Rejection>> + Send {
        Self::from_request_parts(parts, &state.app)
    }
}

pub async fn proxy_handler(
    State(state): State<ProxyState>,
    user: Option<AuthUser>,
    mut req: Request,
) -> Result<impl IntoResponse, StatusCode> {
    if let Entry::Occupied(entry) = req.headers_mut().entry(AUTH_HEADER) {
        entry.remove_entry();
    }

    if let Some(user) = user {
        match HeaderValue::from_str(&user.token) {
            Ok(val) => {
                let _ = req.headers_mut().insert(AUTH_HEADER, val);
            }
            Err(err) => error!("Could not create authentication header: {err}"),
        };
    }

    let mut new_uri = state.upstream.to_string();

    if new_uri.ends_with('/') {
        new_uri.pop();
    }

    new_uri.push_str(&req.uri().to_string());

    *req.uri_mut() = new_uri.parse().map_err(|_| StatusCode::BAD_REQUEST)?;

    state.http_client.request(req).await.map_err(|e| {
        warn!("Proxy http client error: {e:?}");
        StatusCode::INTERNAL_SERVER_ERROR
    })
}
