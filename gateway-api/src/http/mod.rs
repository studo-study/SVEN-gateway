use crate::AppState;
use axum::Router;

mod api_keys;
pub mod auth;
mod models;
mod operations;

pub fn router() -> Router<AppState> {
    Router::new()
        .nest("/v1/auth", auth::router())
        .nest("/v1/api-keys", api_keys::router())
        .nest("/v1/models", models::router())
        .nest("/v1/operations", operations::router())
}
