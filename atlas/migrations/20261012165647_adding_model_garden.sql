-- Your SQL goes here
ALTER TABLE gateway.models
    ADD input_cost_pm integer;
ALTER TABLE gateway.models
    ADD output_cost_pm integer;
ALTER TABLE gateway.models
    ADD cached_cost_pm integer;
ALTER TABLE gateway.models
    ADD context_window varchar(20);
ALTER TABLE gateway.models
    ADD max_output varchar(20);
ALTER TABLE gateway.models
    ADD vision boolean;



CREATE TYPE gateway.platform AS ENUM (
    'anthropic_api',
    'openai_api',
    'google_gemini_api',
    'xai_api',
    'mistral_api',
    'deepseek_api',
    'alibaba_model_studio',
    'cohere_api',
    'baidu_qianfan',
    'tencent_hunyuan_api',
    'moonshot_api',

    'google_vertex_ai',
    'microsoft_foundry',
    'azure_openai',
    'amazon_bedrock',

    'openrouter',
    'together_ai',
    'groq',
    'fireworks_ai',
    'cerebras'
);

ALTER TABLE gateway.models
    ADD COLUMN platform gateway.platform;
