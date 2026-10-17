use argon2::{Argon2, PasswordHash, PasswordVerifier};
use axum::{
    Json, Router,
    extract::{FromRef, FromRequestParts, State},
    http::{header::AUTHORIZATION, request::Parts},
    routing::{get, post},
};
use axum_extra::extract::cookie::{Cookie, CookieJar, SameSite};
use chrono::{Duration, Utc};
use diesel::prelude::*;
use jsonwebtoken::{Algorithm, DecodingKey, EncodingKey, Header, Validation, decode, encode};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::AppState;
use crate::error::AppError;
use crate::models::AuthUser;
use crate::schema_public::users;

pub const COOKIE_NAME: &str = "session";
const ADMIN_ROLE: &str = "admin";

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub email: String,
    pub roles: Vec<String>,
    pub exp: usize,
}

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct UserResponse {
    pub id: Uuid,
    pub email: String,
    pub roles: Vec<String>,
    pub token: String,
}

fn roles_from_json(value: &serde_json::Value) -> Vec<String> {
    value
        .as_array()
        .map(|arr| {
            arr.iter()
                .filter_map(|v| v.as_str().map(String::from))
                .collect()
        })
        .unwrap_or_default()
}

fn create_token(
    user: &AuthUser,
    roles: &[String],
    secret: &str,
) -> jsonwebtoken::errors::Result<String> {
    let exp = (Utc::now() + Duration::days(30)).timestamp() as usize;
    let claims = Claims {
        sub: user.id,
        email: user.email.clone(),
        roles: roles.to_vec(),
        exp,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(secret.as_bytes()),
    )
}

pub fn verify_token(token: &str, secret: &str) -> jsonwebtoken::errors::Result<Claims> {
    let data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(secret.as_bytes()),
        &Validation::new(Algorithm::HS256),
    )?;
    Ok(data.claims)
}

pub async fn login(
    State(state): State<AppState>,
    jar: CookieJar,
    Json(body): Json<LoginRequest>,
) -> Result<(CookieJar, Json<UserResponse>), AppError> {
    let mut conn = state.pool.get()?;

    let user = users::table
        .filter(users::email.eq(&body.email))
        .first::<AuthUser>(&mut conn)
        .optional()?
        .ok_or(AppError::Unauthorized)?;

    let parsed_hash = PasswordHash::new(&user.password_hash).map_err(|_| AppError::Unauthorized)?;
    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed_hash)
        .map_err(|_| AppError::Unauthorized)?;

    let roles = roles_from_json(&user.roles);
    if !roles.iter().any(|r| r == ADMIN_ROLE) {
        return Err(AppError::Forbidden);
    }

    let token =
        create_token(&user, &roles, &state.jwt_secret).map_err(|_| AppError::Unauthorized)?;

    let cookie = Cookie::build((COOKIE_NAME, token.clone()))
        .http_only(true)
        .secure(true)
        .same_site(SameSite::Lax)
        .path("/")
        .build();

    Ok((
        jar.add(cookie),
        Json(UserResponse {
            id: user.id,
            email: user.email,
            roles,
            token,
        }),
    ))
}

pub async fn logout(jar: CookieJar) -> CookieJar {
    let cookie = Cookie::build((COOKIE_NAME, "")).path("/").build();
    jar.remove(cookie)
}

pub async fn me(
    State(state): State<AppState>,
    jar: CookieJar,
) -> Result<Json<UserResponse>, AppError> {
    let token = jar
        .get(COOKIE_NAME)
        .map(|c| c.value().to_string())
        .ok_or(AppError::Unauthorized)?;

    let claims = verify_token(&token, &state.jwt_secret).map_err(|_| AppError::Unauthorized)?;

    Ok(Json(UserResponse {
        id: claims.sub,
        email: claims.email,
        roles: claims.roles,
        token,
    }))
}

/// Authenticated admin, read from `Authorization: Bearer <jwt>` or the session cookie.
pub struct AdminUser(pub Claims);

impl<S> FromRequestParts<S> for AdminUser
where
    AppState: FromRef<S>,
    S: Send + Sync,
{
    type Rejection = AppError;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, AppError> {
        let state = AppState::from_ref(state);
        let bearer = parts
            .headers
            .get(AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .and_then(|v| v.strip_prefix("Bearer "))
            .map(String::from);
        let token = match bearer {
            Some(t) => t,
            None => CookieJar::from_headers(&parts.headers)
                .get(COOKIE_NAME)
                .map(|c| c.value().to_string())
                .ok_or(AppError::Unauthorized)?,
        };
        let claims = verify_token(&token, &state.jwt_secret).map_err(|_| AppError::Unauthorized)?;
        if !claims.roles.iter().any(|r| r == ADMIN_ROLE) {
            return Err(AppError::Forbidden);
        }
        Ok(AdminUser(claims))
    }
}

pub fn router() -> Router<AppState> {
    Router::new()
        .route("/login", post(login))
        .route("/logout", post(logout))
        .route("/me", get(me))
}
