// main/parts/handlers/sqliteHandler/initDatabase/indexes.js

const { tryRunSql } = require("./helpers");

async function createIndexes(db) {
  const aiPromptIndexes = [
    ["idx_ai_prompts_updated_by", "ai_prompts", "updated_by"],
    ["idx_ai_prompts_updated_at", "ai_prompts", "updated_at"],
    ["idx_ai_prompts_staff_id", "ai_prompts", "staff_id"],
    ["idx_ai_prompts_item_id", "ai_prompts", "item_id"],
    ["idx_ai_prompt_histories_prompt_id", "ai_prompt_histories", "prompt_id"],
    ["idx_ai_prompt_histories_created_by", "ai_prompt_histories", "created_by"],
    ["idx_ai_prompt_histories_created_at", "ai_prompt_histories", "created_at"],
  ];

  for (const [indexName, tableName, columnName] of aiPromptIndexes) {
    await tryRunSql(
      db,
      `CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" ("${columnName}")`,
      indexName
    );
  }

  await tryRunSql(
    db,
    `
      DROP INDEX IF EXISTS "idx_temp_notes_children_day"
    `,
    "drop idx_temp_notes_children_day"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_temp_notes_children_day_lookup"
      ON "temp_notes" ("children_id", "day_of_week_id")
    `,
    "idx_temp_notes_children_day_lookup"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_temp_notes_children_staff_day"
      ON "temp_notes" ("children_id", "staff_id", "day_of_week_id")
    `,
    "idx_temp_notes_children_staff_day"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_temp_notes_staff_id"
      ON "temp_notes" ("staff_id")
    `,
    "idx_temp_notes_staff_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_temp_notes_day_of_week_id"
      ON "temp_notes" ("day_of_week_id")
    `,
    "idx_temp_notes_day_of_week_id"
  );

  // managers2
  await tryRunSql(
    db,
    `
      DROP INDEX IF EXISTS "idx_managers2_ids"
    `,
    "drop old idx_managers2_ids"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_managers2_staff_id"
      ON "managers2" ("staff_id")
    `,
    "idx_managers2_staff_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_managers2_day_of_week_id"
      ON "managers2" ("day_of_week_id")
    `,
    "idx_managers2_day_of_week_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_managers2_facility_id"
      ON "managers2" ("facility_id")
    `,
    "idx_managers2_facility_id"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_managers2_ids"
      ON "managers2" (
        "children_id",
        "facility_id",
        "staff_id",
        "day_of_week_id"
      )
    `,
    "idx_managers2_ids"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_facility_children_ids"
      ON "facility_children" ("facility_id", "children_id")
    `,
    "idx_facility_children_ids"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_facility_staff_ids"
      ON "facility_staff" ("facility_id", "staff_id")
    `,
    "idx_facility_staff_ids"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_pc_facility_pc_id"
      ON "pc" ("facility_id", "pc_id")
    `,
    "idx_pc_facility_pc_id"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_service_record_unique"
      ON "service_record" ("children_id", "day_of_week_id", "item_id", "served_date")
    `,
    "idx_service_record_unique"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_staff_facility_roles_unique"
      ON "staff_facility_roles" ("staff_id", "facility_id", "job_name", "experience_label")
    `,
    "idx_staff_facility_roles_unique"
  );

  await tryRunSql(
    db,
    `
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email"
      ON "users" ("email")
    `,
    "idx_users_email"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_pc_to_children_children_id"
      ON "pc_to_children" ("children_id")
    `,
    "idx_pc_to_children_children_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_pc_to_children_pc_id"
      ON "pc_to_children" ("pc_id")
    `,
    "idx_pc_to_children_pc_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_child_records_children_id"
      ON "child_records" ("children_id")
    `,
    "idx_child_records_children_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_child_records_record_type_id"
      ON "child_records" ("record_type_id")
    `,
    "idx_child_records_record_type_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_child_records_facility_id"
      ON "child_records" ("facility_id")
    `,
    "idx_child_records_facility_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_service_record_item_id"
      ON "service_record" ("item_id")
    `,
    "idx_service_record_item_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_service_record_facility_id"
      ON "service_record" ("facility_id")
    `,
    "idx_service_record_facility_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_user_id"
      ON "refresh_tokens" ("user_id")
    `,
    "idx_refresh_tokens_user_id"
  );

  await tryRunSql(
    db,
    `
      CREATE INDEX IF NOT EXISTS "idx_toolbox_facility_id"
      ON "toolbox" ("facility_id")
    `,
    "idx_toolbox_facility_id"
  );
}

module.exports = { createIndexes };
