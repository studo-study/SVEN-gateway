-- Dev seed for operations. Idempotent via the unique slug. Needs models.sql first (model_id is looked up by name + platform).
-- System prompts are placeholders.
INSERT INTO gateway.operations (slug, operation_type, model_type, title, model_id, system_prompt, is_active)
SELECT v.slug, v.operation_type, v.model_type, v.title,
       (SELECT m.id FROM gateway.models m WHERE m.model_name = v.model_name AND m.platform = v.platform),
       v.system_prompt, v.is_active
FROM (VALUES
    ('course-embedding',       'course_embedding'::gateway.operation_type,       'embedding'::gateway.model_type,  'Course embedding',       'text-embedding-3-small',  'openai_api'::gateway.platform,    NULL, true),
    ('studoset-generation',    'studoset_generation'::gateway.operation_type,    'chat'::gateway.model_type,       'Studoset generation',    'claude-sonnet-5-5',       'anthropic_api'::gateway.platform, 'You generate study sets from course material.', true),
    ('visualset-generation',   'visualset_generation'::gateway.operation_type,   'chat'::gateway.model_type,       'Visualset generation',   'gemini-2.5-pro',          'google_gemini_api'::gateway.platform, 'You generate visual study sets.', true),
    ('suggestion-generation',  'suggestion_generation'::gateway.operation_type,  'chat'::gateway.model_type,       'Suggestion generation',  'gpt-4o-mini',             'openai_api'::gateway.platform,    'You suggest what to study next.', true),
    ('chat',                   'chat'::gateway.operation_type,                   'chat'::gateway.model_type,       'Chat',                   'claude-sonnet-5-5',       'anthropic_api'::gateway.platform, 'You are a helpful study assistant.', true),
    ('course-summarizing',     'course_summarizing'::gateway.operation_type,     'chat'::gateway.model_type,       'Course summarizing',     'claude-haiku-4-5-20251001','anthropic_api'::gateway.platform,'You summarize course material concisely.', true),
    ('progression-tracking',   'progression_tracking'::gateway.operation_type,   'chat'::gateway.model_type,       'Progression tracking',   'gpt-4o-mini',             'openai_api'::gateway.platform,    'You assess a student''s progression.', false)
) AS v(slug, operation_type, model_type, title, model_name, platform, system_prompt, is_active)
ON CONFLICT (slug) DO NOTHING;
