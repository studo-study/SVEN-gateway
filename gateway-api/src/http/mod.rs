use axum::Router;
use crate::AppState;

mod auth;
mod models;

pub fn router() ->Router<AppState> {
    Router::new()
        .nest("/v1/auth", auth::router())
        .nest("/v1/models", models::router())

}