use axum::http::{HeaderMap, header};
use axum::routing::post;
use axum::{
    Json, Router,
    extract::{Path, State},
};
use chrono::Utc;
use diesel::prelude::*;

use crate::http::api_keys::hash_key;
use crate::inference::{self, Message, Role, RunRequest, RunResponse};
use crate::models::Model;
use crate::operations::Operation;
use crate::schema::gateway::api_keys::dsl as k;
use crate::schema::gateway::models::dsl as m;
use crate::schema::gateway::operations::dsl as o;
use crate::{AppState, error::AppError};

pub fn router() -> Router<AppState> {
    Router::new().route("/{slug}", post(run))
}

/// Checks the `sven_…` bearer key and stamps `last_used_at`.
fn authenticate(conn: &mut PgConnection, headers: &HeaderMap) -> Result<(), AppError> {
    let secret = headers
        .get(header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .and_then(|v| v.strip_prefix("Bearer "))
        .ok_or(AppError::Unauthorized)?;
    let now = Utc::now().naive_utc();
    let updated = diesel::update(
        k::api_keys
            .filter(k::key_hash.eq(hash_key(secret)))
            .filter(k::revoked_at.is_null())
            .filter(k::expires_at.is_null().or(k::expires_at.gt(now))),
    )
    .set(k::last_used_at.eq(now))
    .execute(conn)?;
    if updated == 0 {
        return Err(AppError::Unauthorized);
    }
    Ok(())
}

/// Single entry point: resolves the operation by slug, prepends its system prompt and
/// runs the request on the operation's model through the matching provider adapter.
async fn run(
    State(state): State<AppState>,
    Path(slug): Path<String>,
    headers: HeaderMap,
    Json(mut request): Json<RunRequest>,
) -> Result<Json<RunResponse>, AppError> {
    let (operation, model) = {
        let mut conn = state.pool.get()?;
        authenticate(&mut conn, &headers)?;
        let operation = o::operations
            .filter(o::slug.eq(&slug))
            .filter(o::is_active.eq(true))
            .first::<Operation>(&mut conn)?;
        let model_id = operation.model_id.ok_or(AppError::BadRequest)?;
        let model = m::models
            .find(model_id)
            .filter(m::active.eq(true))
            .first::<Model>(&mut conn)?;
        (operation, model)
    };

    if let Some(prompt) = operation.system_prompt.filter(|p| !p.is_empty()) {
        request.messages.insert(
            0,
            Message {
                role: Role::System,
                content: prompt,
            },
        );
    }
    Ok(Json(inference::run(&state.http, &model, &request).await?))
}
