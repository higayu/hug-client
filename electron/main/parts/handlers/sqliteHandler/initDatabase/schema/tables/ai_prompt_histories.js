const SQL = `
CREATE TABLE IF NOT EXISTS "ai_prompt_histories" (
  "history_id" INTEGER NOT NULL,
  "prompt_id" INTEGER NOT NULL,
  "content" TEXT NOT NULL,
  "created_by" INTEGER DEFAULT NULL,
  "created_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY("history_id" AUTOINCREMENT),
  CONSTRAINT "fk_ai_prompt_histories_created_by" FOREIGN KEY("created_by") REFERENCES "staffs"("id") ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT "fk_ai_prompt_histories_prompt" FOREIGN KEY("prompt_id") REFERENCES "ai_prompts"("prompt_id") ON UPDATE CASCADE ON DELETE CASCADE
);
`;

module.exports = SQL;
