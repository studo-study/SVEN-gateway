table "api_keys" {
  schema = schema.gateway
  column "id" {
    null    = false
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "user_id" {
    null = false
    type = uuid
  }
  column "description" {
    null = false
    type = character_varying
  }
  column "environment" {
    null = false
    type = character_varying(10)
  }
  column "prefix" {
    null = false
    type = character_varying
  }
  column "key_hash" {
    null = false
    type = character_varying
  }
  column "created_at" {
    null    = false
    type    = timestamp
    default = sql("now()")
  }
  column "last_used_at" {
    null = true
    type = timestamp
  }
  column "expires_at" {
    null = true
    type = timestamp
  }
  column "revoked_at" {
    null = true
    type = timestamp
  }
  primary_key {
    columns = [column.id]
  }
  check "api_keys_environment_check" {
    expr = "((environment)::text = ANY ((ARRAY['dev'::character varying, 'staging'::character varying, 'prod'::character varying])::text[]))"
  }
  unique "api_keys_key_hash_key" {
    columns = [column.key_hash]
  }
}
