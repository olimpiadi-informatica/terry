use std::sync::Arc;
use std::time::Instant;

use axum::Router;
use axum::extract::Request;
use axum::handler::Handler;
use axum::middleware::Next;
use axum::response::Response;
use axum::routing::{get, post};
use http::HeaderValue;
use hyper_util::client::legacy::connect::HttpConnector;
use hyper_util::rt::TokioExecutor;
use sqlx::SqlitePool;
use teloxide::Bot;
use teloxide::types::ChatId;
use tower::Layer;
use tower_http::services::{ServeDir, ServeFile};
use tower_http::set_header::SetResponseHeaderLayer;
use tracing::{info, warn};

use crate::cli::ServeArgs;
use crate::config;
use crate::contest_manager::ContestManager;
use crate::handlers::communication::TelegramBotData;
use crate::handlers::info::CachedData;
use crate::handlers::proxy::{ProxyState, proxy_handler};
use crate::handlers::{admin, auth, communication, contest, info, static_files, upload};

#[derive(Clone, serde::Serialize, serde::Deserialize, Debug)]
pub struct ExtraMaterialSection {
    pub name: String,
    pub url: String,
    pub page: String,
}

#[derive(Clone)]
pub struct AppState {
    pub pool: SqlitePool,
    pub contest_manager: ContestManager,
    pub config: Arc<config::Config>,
    pub telegram_bot: Arc<TelegramBotData>,
    pub cached_data: Arc<CachedData>,
}

pub async fn trace_requests(request: Request, next: Next) -> Response {
    let start = Instant::now();
    let uri = request.uri().path().to_string();
    let method = request.method().clone();

    let response = next.run(request).await;

    let status = response.status();
    let latency = Instant::now().duration_since(start);
    let latency_ms = latency.as_secs_f32() * 1000.0;

    if response.status().is_success() || response.status().is_redirection() {
        info!(uri, ?method, ?latency, ?status, latency_ms, "HTTP");
    } else {
        warn!(uri, ?method, ?latency, ?status, latency_ms, "HTTP");
    }

    response
}

/*
        .route("/api/input/{id}", get(info::get_input))
        .route("/api/output/{id}", get(info::get_output))
        .route("/api/source/{id}", get(info::get_source))
*/

pub fn proxy_router(app_state: AppState) -> Router {
    let mut router = Router::new();

    let http_client = hyper_util::client::legacy::Client::<(), ()>::builder(TokioExecutor::new())
        .build(HttpConnector::new());

    for proxy in &app_state.config.proxy {
        router = router.nest_service(
            &proxy.path,
            proxy_handler.with_state(ProxyState {
                app: app_state.clone(),
                http_client: http_client.clone(),
                upstream: proxy.upstream.parse().expect("Invalid proxy upstream Uri"),
            }),
        );
    }

    router
}

fn create_router(app_state: AppState) -> Router {
    let api = Router::new()
        .route("/status", get(info::get_status))
        .route("/submission/{id}", get(info::get_submission))
        .route("/submissions/{task}", get(info::get_submissions))
        .route("/generate_input/{task_name}", post(contest::generate_input))
        .route("/submit/{input_id}", post(contest::submit))
        .route("/abandon_input/{input_id}", post(contest::abandon_input))
        .route("/upload_output/{input_id}", post(upload::upload_output))
        .route("/upload_source/{input_id}", post(upload::upload_source))
        .route("/login", post(auth::login))
        .route("/logout", post(auth::logout))
        .route(
            "/communications",
            get(communication::list).post(communication::ask),
        )
        .route("/admin/set_extra_time/{id}", post(admin::set_extra_time))
        .route("/admin/user_list", get(admin::user_list))
        .route("/admin/questions", get(admin::questions))
        .route("/admin/answer_question/{id}", post(admin::answer_question))
        .route("/admin/add_announcement", post(admin::add_announcement))
        .route("/admin/ranking", get(admin::download_ranking))
        .layer(SetResponseHeaderLayer::if_not_present(
            http::header::CACHE_CONTROL,
            HeaderValue::from_static("no-store, no-cache"),
        ));

    let serve_static = SetResponseHeaderLayer::if_not_present(
        http::header::CACHE_CONTROL,
        HeaderValue::from_static("public, max-age=31536000, immutable"),
    )
    .layer(ServeDir::new("static/static"));

    let main = SetResponseHeaderLayer::if_not_present(
        http::header::CACHE_CONTROL,
        HeaderValue::from_static("no-cache"),
    )
    .layer(ServeDir::new("static").fallback(ServeFile::new("static/index.html")));

    Router::new()
        .nest("/api", api)
        .route(
            "/statements/{task}/{*path}",
            get(static_files::serve_statement),
        )
        .route(
            "/files/{*path}",
            get(static_files::serve_file_with_attachment),
        )
        .nest_service("/static", serve_static)
        .merge(proxy_router(app_state.clone()).with_state(()))
        .fallback_service(main)
        .layer(axum::middleware::from_fn(trace_requests))
        .with_state(app_state)
}

pub async fn serve(pool: SqlitePool, args: &ServeArgs) -> color_eyre::Result<()> {
    let config = Arc::new(config::load_config(&args.config)?);

    info!("Loaded config: {:?}", config);

    let contest_manager = ContestManager::new(pool.clone(), (*config).clone()).await?;

    let telegram_bot = Arc::new(match config.telegram_bot_token.clone() {
        Some(token) => {
            let url = config
                .telegram_admin_url
                .clone()
                .expect("Missing telegram_admin_url");
            let channel = config
                .telegram_channel_id
                .expect("Missing telegram_channel_id");
            let channel = ChatId(channel);
            info!("Using telegram bot with channel: {}", channel);
            Some((Bot::new(token), channel, url))
        }
        _ => {
            warn!("The telegram bot is disabled");
            None
        }
    });

    let cached_data = Arc::new(CachedData::default());

    let app_state = AppState {
        pool,
        contest_manager,
        config,
        telegram_bot,
        cached_data,
    };

    let socket_addr = args.listen;
    let app = create_router(app_state);
    info!("listening on {}", socket_addr);
    let listener = tokio::net::TcpListener::bind(socket_addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}
