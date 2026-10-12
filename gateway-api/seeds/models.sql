-- Dev seed for the model garden. Idempotent: skips rows whose (model_name, platform) already exist.
-- Costs are in cents per 1M tokens (300 = $3.00 / 1M). Placeholder numbers, adjust to real pricing.
INSERT INTO gateway.models (model_name, model_type, provider, platform, env_key,
                            input_cost_pm, output_cost_pm, cached_cost_pm,
                            context_window, max_output, vision, active, endpoint_url)
SELECT v.*
FROM (VALUES
    ('claude-opus-5-5',          'chat'::gateway.model_type,       'anthropic'::gateway.provider, 'anthropic_api'::gateway.platform,     'ANTHROPIC_API_KEY',  1500, 7500, 150,  '200K', '64K',  true, false, 'https://api.anthropic.com'),
    ('claude-sonnet-5-5',        'chat'::gateway.model_type,       'anthropic'::gateway.provider, 'anthropic_api'::gateway.platform,     'ANTHROPIC_API_KEY',   300, 1500,  30,  '200K', '64K',  true, true, 'https://api.anthropic.com'),
    ('claude-haiku-4-5-20251001','chat'::gateway.model_type,       'anthropic'::gateway.provider, 'anthropic_api'::gateway.platform,     'ANTHROPIC_API_KEY',   100,  500,  10,  '200K', '64K',  true, true, 'https://api.anthropic.com'),
    ('claude-sonnet-5-5',        'chat'::gateway.model_type,       'anthropic'::gateway.provider, 'amazon_bedrock'::gateway.platform,    'AWS_BEDROCK_KEY',     300, 1500,  30,  '200K', '64K',  true, true, NULL),
    ('gpt-4o',                   'chat'::gateway.model_type,       'open_ai'::gateway.provider,   'openai_api'::gateway.platform,        'OPENAI_API_KEY',      250, 1000, 125,  '128K', '16K',  true, true, 'https://api.openai.com/v1'),
    ('gpt-4o-mini',              'chat'::gateway.model_type,       'open_ai'::gateway.provider,   'openai_api'::gateway.platform,        'OPENAI_API_KEY',       15,   60,   8,  '128K', '16K',  true, true, 'https://api.openai.com/v1'),
    ('gpt-4o',                   'chat'::gateway.model_type,       'open_ai'::gateway.provider,   'azure_openai'::gateway.platform,      'AZURE_OPENAI_KEY',    250, 1000, 125,  '128K', '16K',  true, false, NULL),
    ('text-embedding-3-small',   'embedding'::gateway.model_type,  'open_ai'::gateway.provider,   'openai_api'::gateway.platform,        'OPENAI_API_KEY',        2,    0,   0,  '8K',   NULL,   false, true, 'https://api.openai.com/v1'),
    ('gemini-2.5-pro',           'chat'::gateway.model_type,       'google'::gateway.provider,    'google_gemini_api'::gateway.platform, 'GEMINI_API_KEY',      125, 1000,  31,  '1M',   '64K',  true, true, 'https://generativelanguage.googleapis.com'),
    ('gemini-2.5-flash',         'chat'::gateway.model_type,       'google'::gateway.provider,    'google_gemini_api'::gateway.platform, 'GEMINI_API_KEY',       30,  250,   8,  '1M',   '64K',  true, true, 'https://generativelanguage.googleapis.com'),
    ('mistral-large-latest',     'chat'::gateway.model_type,       'mistral'::gateway.provider,   'mistral_api'::gateway.platform,       'MISTRAL_API_KEY',    200,  600,   0,  '128K', '8K',   false, false, 'https://api.mistral.ai/v1'),
    ('deepseek-chat',            'chat'::gateway.model_type,       'deepseek'::gateway.provider,  'deepseek_api'::gateway.platform,      'DEEPSEEK_API_KEY',    27,  110,   7,  '64K',  '8K',   false, false, 'https://api.deepseek.com')
) AS v(model_name, model_type, provider, platform, env_key,
       input_cost_pm, output_cost_pm, cached_cost_pm, context_window, max_output, vision, active, endpoint_url)
WHERE NOT EXISTS (SELECT 1 FROM gateway.models m
                  WHERE m.model_name = v.model_name AND m.platform = v.platform);
