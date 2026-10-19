use axum::http::StatusCode;
use axum::routing::{get, put};
use axum::{
    Json, Router,
    extract::{Path, State},
};
use chrono::Utc;
use diesel::prelude::*;
use diesel::result::{DatabaseErrorKind, Error as DieselError};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::http::auth::AdminUser;
use crate::models::ModelType;
use crate::operations::{Operation, OperationType};
use crate::schema::gateway::operations::dsl as o;
use crate::{AppState, error::AppError};

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(get_operations).post(create_operation))
        .route("/{id}", put(update_operation))
}

#[derive(Serialize)]
struct OperationListResponse {
    operations: Vec<Operation>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct OperationRequest {
    slug: String,
    title: String,
    operation_type: OperationType,
    model_type: ModelType,
    model_id: Option<Uuid>,
    system_prompt: Option<String>,
    is_active: Option<bool>,
}

fn validate(body: &OperationRequest) -> Result<(String, String), AppError> {
    let slug = body.slug.trim().to_string();
    let title = body.title.trim().to_string();
    if slug.is_empty() || slug.len() > 100 || title.is_empty() {
        return Err(AppError::BadRequest);
    }
    Ok((slug, title))
}

// duplicate slug or unknown model_id are caller errors, not 500s
fn map_write_error(err: DieselError) -> AppError {
    match err {
        DieselError::DatabaseError(
            DatabaseErrorKind::UniqueViolation | DatabaseErrorKind::ForeignKeyViolation,
            _,
        ) => AppError::BadRequest,
        other => other.into(),
    }
}

async fn get_operations(
    _admin: AdminUser,
    State(state): State<AppState>,
) -> Result<Json<OperationListResponse>, AppError> {
    let mut conn = state.pool.get()?;
    let all = o::operations
        .order(o::created_at.desc())
        .load::<Operation>(&mut conn)?;
    Ok(Json(OperationListResponse { operations: all }))
}

async fn create_operation(
    _admin: AdminUser,
    State(state): State<AppState>,
    Json(body): Json<OperationRequest>,
) -> Result<(StatusCode, Json<Operation>), AppError> {
    let (slug, title) = validate(&body)?;

    let mut conn = state.pool.get()?;
    let operation = diesel::insert_into(o::operations)
        .values((
            o::slug.eq(slug),
            o::title.eq(title),
            o::operation_type.eq(body.operation_type),
            o::model_type.eq(body.model_type),
            o::model_id.eq(body.model_id),
            o::system_prompt.eq(body.system_prompt),
            o::is_active.eq(body.is_active.unwrap_or(true)),
        ))
        .get_result::<Operation>(&mut conn)
        .map_err(|err| match err {
            DieselError::DatabaseError(
                DatabaseErrorKind::UniqueViolation | DatabaseErrorKind::ForeignKeyViolation,
                _,
            ) => AppError::BadRequest,
            other => other.into(),
        })?;

    Ok((StatusCode::CREATED, Json(operation)))
}

/// Full replace of the editable fields; prompts are sent in full, never truncated.
async fn update_operation(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
    Json(body): Json<OperationRequest>,
) -> Result<Json<Operation>, AppError> {
    let (slug, title) = validate(&body)?;

    let mut conn = state.pool.get()?;
    let operation = diesel::update(o::operations.find(id))
        .set((
            o::slug.eq(slug),
            o::title.eq(title),
            o::operation_type.eq(body.operation_type),
            o::model_type.eq(body.model_type),
            o::model_id.eq(body.model_id),
            o::system_prompt.eq(body.system_prompt),
            o::is_active.eq(body.is_active.unwrap_or(true)),
            o::updated_at.eq(Utc::now().naive_utc()),
        ))
        .get_result::<Operation>(&mut conn)
        .map_err(map_write_error)?;

    Ok(Json(operation))
}
