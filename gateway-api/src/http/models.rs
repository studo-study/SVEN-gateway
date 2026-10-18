use axum::http::StatusCode;
use axum::routing::get;
use axum::{Json, Router, extract::State};
use diesel::prelude::*;
use serde::{Deserialize, Serialize};

use crate::http::auth::AdminUser;
use crate::models::{Model, ModelType, Platform, Provider};
use crate::schema::gateway::models::dsl as m;
use crate::{AppState, error::AppError};

pub fn router() -> Router<AppState> {
    Router::new().route("/", get(get_models).post(create_model))
}

#[derive(Serialize)]
struct ModelListResponse {
    models: Vec<Model>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateModelRequest {
    model_name: String,
    model_type: ModelType,
    provider: Provider,
    platform: Platform,
    endpoint_url: Option<String>,
    input_cost_pm: Option<i32>,
    output_cost_pm: Option<i32>,
    cached_cost_pm: Option<i32>,
    context_window: Option<String>,
    max_output: Option<String>,
    vision: Option<bool>,
}

async fn get_models(
    _admin: AdminUser,
    State(state): State<AppState>,
) -> Result<Json<ModelListResponse>, AppError> {
    let mut conn = state.pool.get()?;
    let all = m::models.load::<Model>(&mut conn)?;
    Ok(Json(ModelListResponse { models: all }))
}

async fn create_model(
    _admin: AdminUser,
    State(state): State<AppState>,
    Json(body): Json<CreateModelRequest>,
) -> Result<(StatusCode, Json<Model>), AppError> {
    let model_name = body.model_name.trim().to_string();
    let negative = [body.input_cost_pm, body.output_cost_pm, body.cached_cost_pm]
        .iter()
        .any(|c| c.is_some_and(|c| c < 0));
    if model_name.is_empty() || negative {
        return Err(AppError::BadRequest);
    }

    let mut conn = state.pool.get()?;
    let model = diesel::insert_into(m::models)
        .values((
            m::model_name.eq(model_name),
            m::model_type.eq(body.model_type),
            m::provider.eq(body.provider),
            m::platform.eq(body.platform),
            m::endpoint_url.eq(body.endpoint_url.filter(|u| !u.trim().is_empty())),
            m::input_cost_pm.eq(body.input_cost_pm),
            m::output_cost_pm.eq(body.output_cost_pm),
            m::cached_cost_pm.eq(body.cached_cost_pm),
            m::context_window.eq(body.context_window),
            m::max_output.eq(body.max_output),
            m::vision.eq(body.vision),
        ))
        .get_result::<Model>(&mut conn)?;

    Ok((StatusCode::CREATED, Json(model)))
}
