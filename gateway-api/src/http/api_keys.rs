use axum::routing::{delete, get};
use axum::{
    Json, Router,
    extract::{Path, State},
    http::StatusCode,
};
use chrono::Utc;
use diesel::prelude::*;
use rand::{Rng, distributions::Alphanumeric};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use uuid::Uuid;

use crate::http::auth::AdminUser;
use crate::models::ApiKey;
use crate::schema::gateway::api_keys::dsl as k;
use crate::{AppState, error::AppError};

const ENVIRONMENTS: [&str; 3] = ["dev", "staging", "prod"];
const PREFIX_LEN: usize = 14;

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/", get(list).post(create))
        .route("/{id}", delete(revoke))
}

#[derive(Deserialize)]
struct CreateRequest {
    description: String,
    environment: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct CreatedKey {
    #[serde(flatten)]
    key: ApiKey,
    /// Shown once; only the hash is stored.
    secret: String,
}

pub fn hash_key(secret: &str) -> String {
    Sha256::digest(secret.as_bytes())
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect()
}

fn env_tag(environment: &str) -> &'static str {
    match environment {
        "dev" => "dev",
        "staging" => "stg",
        _ => "live",
    }
}

async fn list(
    _admin: AdminUser,
    State(state): State<AppState>,
) -> Result<Json<Vec<ApiKey>>, AppError> {
    let mut conn = state.pool.get()?;
    let keys = k::api_keys
        .filter(k::revoked_at.is_null())
        .order(k::created_at.desc())
        .load::<ApiKey>(&mut conn)?;
    Ok(Json(keys))
}

async fn create(
    AdminUser(claims): AdminUser,
    State(state): State<AppState>,
    Json(body): Json<CreateRequest>,
) -> Result<(StatusCode, Json<CreatedKey>), AppError> {
    let description = body.description.trim().to_string();
    if description.is_empty() || !ENVIRONMENTS.contains(&body.environment.as_str()) {
        return Err(AppError::BadRequest);
    }

    let random: String = rand::thread_rng()
        .sample_iter(Alphanumeric)
        .take(40)
        .map(char::from)
        .collect();
    let secret = format!("sven_{}_{random}", env_tag(&body.environment));

    let mut conn = state.pool.get()?;
    let key = diesel::insert_into(k::api_keys)
        .values((
            k::user_id.eq(claims.sub),
            k::description.eq(description),
            k::environment.eq(body.environment),
            k::prefix.eq(&secret[..PREFIX_LEN]),
            k::key_hash.eq(hash_key(&secret)),
        ))
        .get_result::<ApiKey>(&mut conn)?;

    Ok((StatusCode::CREATED, Json(CreatedKey { key, secret })))
}

async fn revoke(
    _admin: AdminUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<StatusCode, AppError> {
    let mut conn = state.pool.get()?;
    let updated = diesel::update(k::api_keys.find(id).filter(k::revoked_at.is_null()))
        .set(k::revoked_at.eq(Utc::now().naive_utc()))
        .execute(&mut conn)?;
    if updated == 0 {
        return Err(AppError::NotFound);
    }
    Ok(StatusCode::NO_CONTENT)
}
