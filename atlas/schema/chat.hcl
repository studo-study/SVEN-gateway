table "conversations" {
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
  column "title" {
    null = true
    type = character_varying
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
  foreign_key "conversations_operation_id_fkey" {
    columns     = [column.operation_id]
    ref_columns = [table.operations.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  foreign_key "conversations_user_id_fkey" {
    columns     = [column.user_id]
    ref_columns = [table.users.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  index "idx_conversations_user_id" {
    columns = [column.user_id]
  }
}

table "messages" {
  schema = schema.gateway
  column "id" {
    null    = false
    type    = uuid
    default = sql("gen_random_uuid()")
  }
  column "conversation_id" {
    null = false
    type = uuid
  }
  column "role" {
    null = false
    type = enum.message_role
  }
  column "content" {
    null = false
    type = text
  }
  column "model_id" {
    null = true
    type = uuid
  }
  column "prompt_tokens" {
    null = true
    type = integer
  }
  column "completion_tokens" {
    null = true
    type = integer
  }
  column "created_at" {
    null    = false
    type    = timestamp
    default = sql("now()")
  }
  primary_key {
    columns = [column.id]
  }
  foreign_key "messages_conversation_id_fkey" {
    columns     = [column.conversation_id]
    ref_columns = [table.conversations.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  foreign_key "messages_model_id_fkey" {
    columns     = [column.model_id]
    ref_columns = [table.models.column.id]
    on_update   = NO_ACTION
    on_delete   = NO_ACTION
  }
  index "idx_messages_conversation_id" {
    columns = [column.conversation_id]
  }
}
