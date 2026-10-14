const SQL = `
CREATE TABLE IF NOT EXISTS "ai_prompts" (
  "prompt_id" INTEGER NOT NULL,
  "staff_id" INTEGER DEFAULT NULL,
  "item_id" INTEGER DEFAULT NULL,
  "content" TEXT NOT NULL,
  "is_active" INTEGER NOT NULL DEFAULT 0,
  "updated_by" INTEGER DEFAULT NULL,
  "updated_at" TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY("prompt_id" AUTOINCREMENT),
  UNIQUE("is_active", "staff_id", "item_id"),
  CHECK("is_active" IN (0, 1)),
  CONSTRAINT "FK_ai_prompts_m_pronpt_items" FOREIGN KEY("item_id") REFERENCES "m_pronpt_items"("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "FK_ai_prompts_staffs" FOREIGN KEY("staff_id") REFERENCES "staffs"("id") ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT "fk_ai_prompts_updated_by" FOREIGN KEY("updated_by") REFERENCES "staffs"("id") ON UPDATE CASCADE ON DELETE SET NULL
);
`;

module.exports = SQL;
