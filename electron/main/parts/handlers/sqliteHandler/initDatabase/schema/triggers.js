const TRIGGERS_SQL = `
CREATE TRIGGER IF NOT EXISTS "trg_ai_prompts_updated_at"
AFTER UPDATE ON "ai_prompts"
FOR EACH ROW
WHEN NEW."updated_at" = OLD."updated_at"
BEGIN
  UPDATE "ai_prompts"
  SET "updated_at" = CURRENT_TIMESTAMP
  WHERE "prompt_id" = NEW."prompt_id";
END;
`;

module.exports = { TRIGGERS_SQL };
