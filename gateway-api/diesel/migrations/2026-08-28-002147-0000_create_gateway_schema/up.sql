-- Your SQL goes here
CREATE SCHEMA IF NOT EXISTS gateway;

--enums
CREATE TYPE gateway.log_type AS ENUM ('success', 'error', 'timeout', 'rate_limited');
CREATE TYPE gateway.user_plan AS ENUM ('select-individual', 'select-group', 'enterprise', 'free');
CREATE TYPE gateway.model_type AS ENUM ('embedding','generation','chat');
CREATE TYPE gateway.message_role AS ENUM ('user', 'assistant', 'system');
CREATE TYPE gateway.provider AS ENUM (
    'anthropic',
    'open_ai',
    'google',
    'meta_ai',
    'microsoft',
    'amazon',
    'xAi',
    'mistral',
    'deepseek',
    'alibaba',
    'cohere',
    'baidu',
    'tencent',
    'moonshot'
    );
CREATE TYPE gateway.operation_type AS ENUM (
    'course_embedding',
    'studoset_generation',
    'visualset_generation',
    'suggestion_generation',
    'chat','course_summarizing',
    'progression_tracking'
    );

-- tables
CREATE TABLE gateway.models
(
    id             UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    model_name     VARCHAR(150),
    model_type     gateway.model_type NOT NULL,
    provider       gateway.provider   NOT NULL,
    env_key        VARCHAR            NOT NULL,
    cost_per_token INT,
    created_at     TIMESTAMP          NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP

);

CREATE TABLE gateway.operations
(
    id             UUID PRIMARY KEY                DEFAULT gen_random_uuid(),
    slug           VARCHAR(100)           NOT NULL UNIQUE,
    operation_type gateway.operation_type NOT NULL,
    model_type     gateway.model_type     NOT NULL,
    title          VARCHAR                NOT NULL,
    model_id       UUID REFERENCES gateway.models (id),
    prompt         TEXT,
    is_active      BOOLEAN                NOT NULL DEFAULT true,
    created_at     TIMESTAMP              NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP

);

CREATE TABLE gateway.conversations
(
    id           UUID PRIMARY KEY   DEFAULT gen_random_uuid(),
    user_id      UUID      NOT NULL REFERENCES public.users (id),
    operation_id UUID REFERENCES gateway.operations (id),
    title        VARCHAR,
    created_at   TIMESTAMP NOT NULL DEFAULT now(),
    updated_at   TIMESTAMP
);

CREATE TABLE gateway.messages
(
    id                UUID PRIMARY KEY              DEFAULT gen_random_uuid(),
    conversation_id   UUID                 NOT NULL REFERENCES gateway.conversations (id),
    role              gateway.message_role NOT NULL,
    content           TEXT                 NOT NULL,
    model_id          UUID REFERENCES gateway.models (id),
    prompt_tokens     INTEGER,
    completion_tokens INTEGER,
    created_at        TIMESTAMP            NOT NULL DEFAULT now()
);

CREATE TABLE gateway.operation_logs
(
    id           UUID PRIMARY KEY            DEFAULT gen_random_uuid(),
    user_id      UUID             NOT NULL REFERENCES public.users (id),
    operation_id UUID REFERENCES gateway.operations (id),
    model_id     UUID REFERENCES gateway.models (id),
    log_type     gateway.log_type NOT NULL,
    tokens       INTEGER,
    latency_ms   INTEGER,
    error_msg    TEXT,
    created_at   TIMESTAMP        NOT NULL DEFAULT now()
);

CREATE INDEX idx_operation_logs_user_id ON gateway.operation_logs (user_id);
CREATE INDEX idx_operation_logs_created_at ON gateway.operation_logs (created_at);
CREATE INDEX idx_conversations_user_id ON gateway.conversations (user_id);
CREATE INDEX idx_messages_conversation_id ON gateway.messages (conversation_id);
