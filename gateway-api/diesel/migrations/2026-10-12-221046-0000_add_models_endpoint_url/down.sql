UPDATE gateway.models SET env_key = '' WHERE env_key IS NULL;
ALTER TABLE gateway.models
    ALTER COLUMN env_key SET NOT NULL;
ALTER TABLE gateway.models
    DROP COLUMN endpoint_url;
