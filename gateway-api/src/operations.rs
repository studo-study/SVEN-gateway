use chrono::NaiveDateTime;
use diesel::prelude::*;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

#[derive(Debug, Clone, Copy, diesel_derive_enum::DbEnum, Serialize, Deserialize)]
#[ExistingTypePath = "crate::schema::gateway::sql_types::OperationType"]
#[serde(rename_all = "snake_case")]
pub enum OperationType {
    CourseEmbedding,
    StudosetGeneration,
    VisualsetGeneration,
    SuggestionGeneration,
    Chat,
    CourseSummarizing,
    ProgressionTracking,
}

// field order must match `gateway.operations` in schema.rs
#[derive(Queryable, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Operation {
    pub id: Uuid,
    pub slug: String,
    pub operation_type: OperationType,
    pub model_type: crate::models::ModelType,
    pub title: String,
    pub model_id: Option<Uuid>,
    pub prompt: Option<String>,
    pub is_active: bool,
    pub created_at: NaiveDateTime,
    pub updated_at: Option<NaiveDateTime>,
    pub system_prompt: Option<String>,
}
