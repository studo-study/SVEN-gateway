mod config;
mod error;
mod http;
mod inference;
mod models;
mod operations;
mod schema;
mod schema_public;

use axum::{
    Json, Router,
    extract::{Path, State},
    http::{
        HeaderValue, Method,
        header::{AUTHORIZATION, CONTENT_TYPE},
    },
    routing::get,
};
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::EnvFilter;
use uuid::Uuid;

use config::Config;
use error::AppError;
use models::Conversation;

type DbPool = Pool<ConnectionManager<PgConnection>>;

#[derive(Clone)]
pub struct AppState {
    pool: DbPool,
    jwt_secret: String,
    http: reqwest::Client,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    tracing_subscriber::fmt()
        .with_env_filter(
            EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| EnvFilter::new("info,tower_http=debug")),
        )
        .init();

    let config = Config::from_env();

    let manager = ConnectionManager::<PgConnection>::new(&config.database_url);
    let pool = Pool::builder()
        .build(manager)
        .expect("failed to create db pool");

    let port = config.port.clone();

    let cors = CorsLayer::new()
        .allow_origin(
            config
                .frontend_origin
                .parse::<HeaderValue>()
                .expect("FRONTEND_URL must be a valid origin"),
        )
        .allow_credentials(true)
        .allow_methods([
            Method::GET,
            Method::POST,
            Method::PUT,
            Method::DELETE,
            Method::OPTIONS,
        ])
        .allow_headers([CONTENT_TYPE, AUTHORIZATION]);

    let app = Router::new()
        .route("/", get(root_handler))
        .route("/v1/conversations/{id}", get(get_conversation))
        .merge(http::router())
        .with_state(AppState {
            pool,
            jwt_secret: config.jwt_secret,
            http: reqwest::Client::builder()
                .connect_timeout(std::time::Duration::from_secs(5))
                .timeout(inference::UPSTREAM_TIMEOUT)
                .build()
                .expect("failed to build http client"),
        })
        .layer(cors)
        .layer(TraceLayer::new_for_http());

    let addr = format!("0.0.0.0:{port}");
    let listener = tokio::net::TcpListener::bind(&addr)
        .await
        .unwrap_or_else(|err| panic!("failed to bind {addr}: {err}"));
    tracing::info!("server running on http://localhost:{port}");

    axum::serve(listener, app).await.unwrap();
}

async fn root_handler() -> &'static str {
    "Hello from Axum!"
}

async fn get_conversation(
    State(state): State<AppState>,
    Path(conversation_id): Path<Uuid>,
) -> Result<Json<Conversation>, AppError> {
    use schema::gateway::conversations::dsl::conversations;

    let mut conn = state.pool.get()?;
    let conversation = conversations.find(conversation_id).first(&mut conn)?;

    Ok(Json(conversation))
}
