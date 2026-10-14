const AI_PROMPT_INDEXES_SQL = `
CREATE INDEX IF NOT EXISTS "idx_ai_prompts_updated_by" ON "ai_prompts" ("updated_by");
CREATE INDEX IF NOT EXISTS "idx_ai_prompts_updated_at" ON "ai_prompts" ("updated_at");
CREATE INDEX IF NOT EXISTS "idx_ai_prompts_staff_id" ON "ai_prompts" ("staff_id");
CREATE INDEX IF NOT EXISTS "idx_ai_prompts_item_id" ON "ai_prompts" ("item_id");
CREATE INDEX IF NOT EXISTS "idx_ai_prompt_histories_prompt_id" ON "ai_prompt_histories" ("prompt_id");
CREATE INDEX IF NOT EXISTS "idx_ai_prompt_histories_created_by" ON "ai_prompt_histories" ("created_by");
CREATE INDEX IF NOT EXISTS "idx_ai_prompt_histories_created_at" ON "ai_prompt_histories" ("created_at");
`;

module.exports = { AI_PROMPT_INDEXES_SQL };
