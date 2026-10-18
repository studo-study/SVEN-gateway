enum "log_type" {
  schema = schema.gateway
  values = ["success", "error", "timeout", "rate_limited"]
}

enum "user_plan" {
  schema = schema.gateway
  values = ["select-individual", "select-group", "enterprise", "free"]
}

enum "model_type" {
  schema = schema.gateway
  values = ["embedding", "generation", "chat"]
}

enum "message_role" {
  schema = schema.gateway
  values = ["user", "assistant", "system"]
}

enum "provider" {
  schema = schema.gateway
  values = ["anthropic", "open_ai", "google", "meta_ai", "microsoft", "amazon", "xAi", "mistral", "deepseek", "alibaba", "cohere", "baidu", "tencent", "moonshot"]
}

enum "operation_type" {
  schema = schema.gateway
  values = ["course_embedding", "studoset_generation", "visualset_generation", "suggestion_generation", "chat", "course_summarizing", "progression_tracking"]
}

enum "platform" {
  schema = schema.gateway
  values = ["anthropic_api", "openai_api", "google_gemini_api", "xai_api", "mistral_api", "deepseek_api", "alibaba_model_studio", "cohere_api", "baidu_qianfan", "tencent_hunyuan_api", "moonshot_api", "google_vertex_ai", "microsoft_foundry", "azure_openai", "amazon_bedrock", "openrouter", "together_ai", "groq", "fireworks_ai", "cerebras"]
}
