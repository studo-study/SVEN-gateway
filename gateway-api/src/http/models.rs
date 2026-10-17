use axum::routing::get;
use axum::{Json, Router, extract::State};
use diesel::prelude::*;
use serde::Serialize;

use crate::http::auth::AdminUser;
use crate::models::Model;
use crate::schema::gateway::models::dsl::models;
use crate::{AppState, error::AppError};

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_models))
}

#[derive(Serialize)]
struct ModelListResponse {
    models: Vec<Model>,
}

async fn get_models(
    _admin: AdminUser,
    State(state): State<AppState>,
) -> Result<Json<ModelListResponse>, AppError> {
    let mut conn = state.pool.get()?;
    let all = models.load::<Model>(&mut conn)?;
    Ok(Json(ModelListResponse { models: all }))
}
