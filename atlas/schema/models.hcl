table "models" {
  schema = schema.gateway
  column "id" {
    null    = false
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "model_name" {
    null = true
    type = character_varying(150)
  }
  column "model_type" {
    null = false
    type = enum.model_type
  }
  column "provider" {
    null = false
    type = enum.provider
  }
  column "env_key" {
    null = true
    type = character_varying
  }
  column "cost_per_token" {
    null = true
    type = integer
  }
  column "created_at" {
    null    = false
    type    = timestamp
    default = sql("now()")
  }
  column "updated_at" {
    null = true
    type = timestamp
  }
  column "input_cost_pm" {
    null = true
    type = integer
  }
  column "output_cost_pm" {
    null = true
    type = integer
  }
  column "cached_cost_pm" {
    null = true
    type = integer
  }
  column "context_window" {
    null = true
    type = character_varying(20)
  }
  column "max_output" {
    null = true
    type = character_varying(20)
  }
  column "vision" {
    null = true
    type = boolean
  }
  column "platform" {
    null = true
    type = enum.platform
  }
  column "active" {
    null    = false
    type    = boolean
    default = true
  }
  column "endpoint_url" {
    null = true
    type = character_varying
  }
  primary_key {
    columns = [column.id]
  }
}
