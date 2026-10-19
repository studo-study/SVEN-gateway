table "operation_logs" {
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
  column "operation_id" {
    null = true
    type = uuid
  }
  column "model_id" {
    null = true
    type = uuid
  }
  column "log_type" {
    null = false
    type = enum.log_type
  }
  column "tokens" {
    null = true
    type = integer
  }
  column "latency_ms" {
    null = true
    type = integer
  }
  column "error_msg" {
    null = true
    type = text
  }
  column "created_at" {
    null    = false
    type    = timestamp
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "operation_logs_model_id_fkey" {
    columns     = [column.model_id]
    ref_columns = [table.models.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  foreign_key "operation_logs_operation_id_fkey" {
    columns     = [column.operation_id]
    ref_columns = [table.operations.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  foreign_key "operation_logs_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  index "idx_operation_logs_created_at" {
    columns = [column.created_at]
  }
  index "idx_operation_logs_user_id" {
    columns = [column.user_id]
  }
}

table "operations" {
  schema = schema.gateway
  column "id" {
    null    = false
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "slug" {
    null = false
    type = character_varying(100)
  }
  column "operation_type" {
    null = false
    type = enum.operation_type
  }
  column "model_type" {
    null = false
    type = enum.model_type
  }
  column "title" {
    null = false
    type = character_varying
  }
  column "model_id" {
    null = true
    type = uuid
  }

  column "system_prompt" {
    null = true
    type = text
  }
  


  column "is_active" {
    null    = false
    type    = boolean
    default = true
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
  primary_key {
    columns = [column.id]
  }
  foreign_key "operations_model_id_fkey" {
    columns     = [column.model_id]
    ref_columns = [table.models.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  unique "operations_slug_key" {
    columns = [column.slug]
  }
}
