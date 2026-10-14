// main/parts/handlers/sqliteHandler/initDatabase/migrations/migrateLegacyDayOfWeek.js

const {
    getColumns,
    tableExists,
    runSql,
    quoteIdent,
  } = require("../helpers");
  
  async function migrateLegacyDayOfWeekIfNeeded(db) {
    const exists = await tableExists(db, "day_of_week");
    if (!exists) return;
  
    const columns = await getColumns(db, "day_of_week");
  
    const isCurrentSchema =
      columns.includes("id") &&
      columns.includes("label_jp") &&
      columns.includes("label_en") &&
      columns.includes("sort_order");
  
    if (isCurrentSchema) return;
  
    const looksLikeLegacyLocalTable =
      columns.includes("children_id") ||
      columns.includes("staff_id") ||
      columns.includes("days");
  
    if (!looksLikeLegacyLocalTable) {
      console.warn(
        "[initDatabase] day_of_week exists but schema is unknown. Not renamed."
      );
      return;
    }
  
    const backupName = `child_staff_week_days_backup_${Date.now()}`;
  
    console.warn(
      `[initDatabase] legacy day_of_week detected. Renaming to ${backupName}`
    );
  
    await runSql(
      db,
      `ALTER TABLE ${quoteIdent("day_of_week")} RENAME TO ${quoteIdent(backupName)}`
    );
  }
  
  module.exports = { migrateLegacyDayOfWeekIfNeeded };