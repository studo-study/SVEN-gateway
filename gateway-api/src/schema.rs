// @generated automatically by Diesel CLI.

pub mod gateway {
    pub mod sql_types {
        #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
        #[diesel(postgres_type(name = "log_type", schema = "gateway"))]
        pub struct LogType;

        #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
        #[diesel(postgres_type(name = "message_role", schema = "gateway"))]
        pub struct MessageRole;

        #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
        #[diesel(postgres_type(name = "model_type", schema = "gateway"))]
        pub struct ModelType;

        #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
        #[diesel(postgres_type(name = "operation_type", schema = "gateway"))]
        pub struct OperationType;

        #[derive(diesel::query_builder::QueryId, Clone, diesel::sql_types::SqlType)]
        #[diesel(postgres_type(name = "provider", schema = "gateway"))]
        pub struct Provider;
    }

    diesel::table! {
        gateway.conversations (id) {
            id -> Uuid,
            user_id -> Uuid,
            operation_id -> Nullable<Uuid>,
            title -> Nullable<Varchar>,
            created_at -> Timestamp,
            updated_at -> Nullable<Timestamp>,
        }
    }

    diesel::table! {
        use diesel::sql_types::*;
        use super::sql_types::MessageRole;

        gateway.messages (id) {
            id -> Uuid,
            conversation_id -> Uuid,
            role -> MessageRole,
            content -> Text,
            model_id -> Nullable<Uuid>,
            prompt_tokens -> Nullable<Int4>,
            completion_tokens -> Nullable<Int4>,
            created_at -> Timestamp,
        }
    }

    diesel::table! {
        use diesel::sql_types::*;
        use super::sql_types::ModelType;
        use super::sql_types::Provider;

        gateway.models (id) {
            id -> Uuid,
            #[max_length = 150]
            model_name -> Nullable<Varchar>,
            model_type -> ModelType,
            provider -> Provider,
            env_key -> Varchar,
            cost_per_token -> Nullable<Int4>,
            created_at -> Timestamp,
            updated_at -> Nullable<Timestamp>,
        }
    }

    diesel::table! {
        use diesel::sql_types::*;
        use super::sql_types::LogType;

        gateway.operation_logs (id) {
            id -> Uuid,
            user_id -> Uuid,
            operation_id -> Nullable<Uuid>,
            model_id -> Nullable<Uuid>,
            log_type -> LogType,
            tokens -> Nullable<Int4>,
            latency_ms -> Nullable<Int4>,
            error_msg -> Nullable<Text>,
            created_at -> Timestamp,
        }
    }

    diesel::table! {
        use diesel::sql_types::*;
        use super::sql_types::OperationType;
        use super::sql_types::ModelType;

        gateway.operations (id) {
            id -> Uuid,
            #[max_length = 100]
            slug -> Varchar,
            operation_type -> OperationType,
            model_type -> ModelType,
            title -> Varchar,
            model_id -> Nullable<Uuid>,
            prompt -> Nullable<Text>,
            is_active -> Bool,
            created_at -> Timestamp,
            updated_at -> Nullable<Timestamp>,
        }
    }

    diesel::joinable!(conversations -> operations (operation_id));
    diesel::joinable!(messages -> conversations (conversation_id));
    diesel::joinable!(messages -> models (model_id));
    diesel::joinable!(operation_logs -> models (model_id));
    diesel::joinable!(operation_logs -> operations (operation_id));
    diesel::joinable!(operations -> models (model_id));

    diesel::allow_tables_to_appear_in_same_query!(
        conversations,
        messages,
        models,
        operation_logs,
        operations,
    );
}
