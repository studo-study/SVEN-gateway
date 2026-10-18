ALTER TABLE gateway.models
    ADD COLUMN endpoint_url VARCHAR;
ALTER TABLE gateway.models
    ALTER COLUMN env_key DROP NOT NULL;
