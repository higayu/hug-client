// main/parts/handlers/sqliteHandler/initDatabase/migrations/migrateManagers2ToFacilitySchema.js

const {
    allSql,
    execSql,
    getColumns,
    getTableInfo,
    tableExists,
  } = require("../helpers");
  
  async function migrateManagers2ToFacilitySchema(db) {
    const exists = await tableExists(db, "managers2");
    if (!exists) return;
  
    const tableInfo = await getTableInfo(db, "managers2");
    const columns = tableInfo.map((row) => row.name);
  
    const pkColumns = tableInfo
      .filter((row) => Number(row.pk) > 0)
      .sort((a, b) => Number(a.pk) - Number(b.pk))
      .map((row) => row.name);
  
    const hasFacilityId = columns.includes("facility_id");
  
    const isCurrentPk =
      pkColumns.join(",") ===
      "children_id,facility_id,staff_id,day_of_week_id";
  
    if (hasFacilityId && isCurrentPk) {
      console.log("[initDatabase] managers2 schema is current.", {
        columns,
        pkColumns,
      });
      return;
    }
  
    const backupName = `managers2_backup_${Date.now()}`;
  
    console.warn("[initDatabase] managers2 old schema detected.", {
      columns,
      pkColumns,
      hasFacilityId,
      backupName,
    });
  
    await execSql(
      db,
      `
        DROP INDEX IF EXISTS "idx_managers2_ids";
        DROP INDEX IF EXISTS "idx_managers2_staff_id";
        DROP INDEX IF EXISTS "idx_managers2_day_of_week_id";
        DROP INDEX IF EXISTS "idx_managers2_facility_id";
  
        ALTER TABLE "managers2" RENAME TO "${backupName}";
  
        CREATE TABLE "managers2" (
          "children_id" INTEGER NOT NULL,
          "facility_id" INTEGER NOT NULL,
          "staff_id" INTEGER NOT NULL,
          "day_of_week_id" INTEGER NOT NULL,
          "priority" INTEGER NOT NULL DEFAULT 0,
          "support_start_time" TEXT DEFAULT NULL,
          "support_end_time" TEXT DEFAULT NULL,
          PRIMARY KEY (
            "children_id",
            "facility_id",
            "staff_id",
            "day_of_week_id"
          )
        );
      `
    );
  
    const backupColumns = await getColumns(db, backupName);
    const backupHasFacilityId = backupColumns.includes("facility_id");
    const backupHasPriority = backupColumns.includes("priority");
    const backupHasSupportStartTime = backupColumns.includes("support_start_time");
    const backupHasSupportEndTime = backupColumns.includes("support_end_time");
  
    if (backupHasFacilityId) {
      await execSql(
        db,
        `
          INSERT OR IGNORE INTO "managers2" (
            "children_id",
            "facility_id",
            "staff_id",
            "day_of_week_id",
            "priority",
            "support_start_time",
            "support_end_time"
          )
          SELECT
            "children_id",
            COALESCE("facility_id", 1),
            "staff_id",
            "day_of_week_id",
            ${backupHasPriority ? `COALESCE("priority", 0)` : `0`},
            ${backupHasSupportStartTime ? `"support_start_time"` : `NULL`},
            ${backupHasSupportEndTime ? `"support_end_time"` : `NULL`}
          FROM "${backupName}"
          WHERE
            "children_id" IS NOT NULL
            AND "staff_id" IS NOT NULL
            AND "day_of_week_id" IS NOT NULL;
        `
      );
    } else {
      await execSql(
        db,
        `
          INSERT OR IGNORE INTO "managers2" (
            "children_id",
            "facility_id",
            "staff_id",
            "day_of_week_id",
            "priority",
            "support_start_time",
            "support_end_time"
          )
          SELECT
            m."children_id",
            COALESCE(
              (
                SELECT MIN(fc."facility_id")
                FROM "facility_children" fc
                JOIN "facility_staff" fs
                  ON fs."facility_id" = fc."facility_id"
                 AND fs."staff_id" = m."staff_id"
                WHERE fc."children_id" = m."children_id"
              ),
              (
                SELECT MIN(fc."facility_id")
                FROM "facility_children" fc
                WHERE fc."children_id" = m."children_id"
              ),
              1
            ) AS "facility_id",
            m."staff_id",
            m."day_of_week_id",
            ${backupHasPriority ? `COALESCE(m."priority", 0)` : `0`},
            ${backupHasSupportStartTime ? `m."support_start_time"` : `NULL`},
            ${backupHasSupportEndTime ? `m."support_end_time"` : `NULL`}
          FROM "${backupName}" m
          WHERE
            m."children_id" IS NOT NULL
            AND m."staff_id" IS NOT NULL
            AND m."day_of_week_id" IS NOT NULL;
        `
      );
    }
  
    const migratedRows = await allSql(
      db,
      `SELECT COUNT(*) AS count FROM "managers2"`
    );
  
    console.warn("[initDatabase] managers2 migrated.", {
      backupName,
      migratedCount: migratedRows?.[0]?.count ?? 0,
    });
  }
  
  module.exports = { migrateManagers2ToFacilitySchema };