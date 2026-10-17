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

#[derive(Debug, Clone, Copy, diesel_derive_enum::DbEnum, Serialize)]
#[ExistingTypePath = "crate::schema::gateway::sql_types::ModelType"]
#[serde(rename_all = "snake_case")]
pub enum ModelType {
    Embedding,
    Generation,
    Chat,
}

#[derive(Debug, Clone, Copy, diesel_derive_enum::DbEnum, Serialize)]
#[ExistingTypePath = "crate::schema::gateway::sql_types::Provider"]
#[serde(rename_all = "snake_case")]
pub enum Provider {
    Anthropic,
    OpenAi,
    Google,
    MetaAi,
    Microsoft,
    Amazon,
    #[db_rename = "xAi"]
    #[serde(rename = "xAi")]
    XAi,
    Mistral,
    Deepseek,
    Alibaba,
    Cohere,
    Baidu,
    Tencent,
    Moonshot,
}

#[derive(Debug, Clone, Copy, diesel_derive_enum::DbEnum, Serialize)]
#[ExistingTypePath = "crate::schema::gateway::sql_types::Platform"]
#[serde(rename_all = "snake_case")]
pub enum Platform {
    AnthropicApi,
    OpenaiApi,
    GoogleGeminiApi,
    XaiApi,
    MistralApi,
    DeepseekApi,
    AlibabaModelStudio,
    CohereApi,
    BaiduQianfan,
    TencentHunyuanApi,
    MoonshotApi,
    GoogleVertexAi,
    MicrosoftFoundry,
    AzureOpenai,
    AmazonBedrock,
    Openrouter,
    TogetherAi,
    Groq,
    FireworksAi,
    Cerebras,
}

// field order must match `gateway.models` in schema.rs
#[derive(Queryable, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Model {
    pub id: Uuid,
    pub model_name: Option<String>,
    pub model_type: ModelType,
    pub provider: Provider,
    #[serde(skip)]
    pub env_key: Option<String>,
    pub cost_per_token: Option<i32>,
    pub created_at: NaiveDateTime,
    pub updated_at: Option<NaiveDateTime>,
    pub input_cost_pm: Option<i32>,
    pub output_cost_pm: Option<i32>,
    pub cached_cost_pm: Option<i32>,
    pub context_window: Option<String>,
    pub max_output: Option<String>,
    pub vision: Option<bool>,
    pub platform: Option<Platform>,
    pub active: bool,
    pub endpoint_url: Option<String>,
}

// field order must match `gateway.api_keys` in schema.rs
#[derive(Queryable, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ApiKey {
    pub id: Uuid,
    pub user_id: Uuid,
    pub description: String,
    pub environment: String,
    pub prefix: String,
    #[serde(skip)]
    pub key_hash: String,
    pub created_at: NaiveDateTime,
    pub last_used_at: Option<NaiveDateTime>,
    pub expires_at: Option<NaiveDateTime>,
    pub revoked_at: Option<NaiveDateTime>,
}
