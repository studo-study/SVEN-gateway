CREATE TABLE gateway.api_keys
(
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID        NOT NULL,
    description  VARCHAR     NOT NULL,
    environment  VARCHAR(10) NOT NULL CHECK (environment IN ('dev', 'staging', 'prod')),
    prefix       VARCHAR     NOT NULL,
    key_hash     VARCHAR     NOT NULL UNIQUE,
    created_at   TIMESTAMP   NOT NULL DEFAULT now(),
    last_used_at TIMESTAMP,
    expires_at   TIMESTAMP,
    revoked_at   TIMESTAMP
);
