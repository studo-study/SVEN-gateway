mod config;
mod error;
mod models;
mod schema;

use axum::{
    Json, Router,
    extract::{Path, State},
    routing::get,
};
use diesel::prelude::*;
use diesel::r2d2::{ConnectionManager, Pool};
use uuid::Uuid;

use config::Config;
use error::AppError;
use models::Conversation;

type DbPool = Pool<ConnectionManager<PgConnection>>;

#[derive(Clone)]
struct AppState {
    pool: DbPool,
}

#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();
    let config = Config::from_env();

    let manager = ConnectionManager::<PgConnection>::new(&config.database_url);
    let pool = Pool::builder()
        .build(manager)
        .expect("failed to create db pool");

    let port = config.port.clone();
    let app = Router::new()
        .route("/", get(root_handler))
        .route("/v1/conversations/{id}", get(get_conversation))
        .with_state(AppState { pool });

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{port}"))
        .await
        .unwrap();
    println!("Server running on http://localhost:{port}");

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
