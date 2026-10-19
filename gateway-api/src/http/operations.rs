use axum::http::StatusCode;
use axum::routing::get;
use axum::{Json, Router, extract::State};
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
    Router::new().route("/", get(get_operations).post(create_operation))
}

#[derive(Serialize)]
struct OperationListResponse {
    operations: Vec<Operation>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CreateOperationRequest {
    slug: String,
    title: String,
    operation_type: OperationType,
    model_type: ModelType,
    model_id: Option<Uuid>,
    prompt: Option<String>,
    system_prompt: Option<String>,
    is_active: Option<bool>,
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
    Json(body): Json<CreateOperationRequest>,
) -> Result<(StatusCode, Json<Operation>), AppError> {
    let slug = body.slug.trim().to_string();
    let title = body.title.trim().to_string();
    if slug.is_empty() || slug.len() > 100 || title.is_empty() {
        return Err(AppError::BadRequest);
    }

    let mut conn = state.pool.get()?;
    let operation = diesel::insert_into(o::operations)
        .values((
            o::slug.eq(slug),
            o::title.eq(title),
            o::operation_type.eq(body.operation_type),
            o::model_type.eq(body.model_type),
            o::model_id.eq(body.model_id),
            o::prompt.eq(body.prompt),
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
