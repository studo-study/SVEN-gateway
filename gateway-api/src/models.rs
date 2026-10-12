use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::Serialize;
use uuid::Uuid;

#[derive(Queryable, Serialize)]
pub struct Conversation {
    pub id: Uuid,
    pub user_id: Uuid,
    pub operation_id: Option<Uuid>,
    pub title: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: Option<NaiveDateTime>,
}

#[derive(Queryable)]
pub struct AuthUser {
    pub id: Uuid,
    pub email: String,
    pub password_hash: String,
    pub roles: serde_json::Value,
}
