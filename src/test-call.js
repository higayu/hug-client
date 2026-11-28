const Database = require("better-sqlite3");
const path = require("path");

function main() {
  try {
    // SQLite DB ファイル
    const dbPath = path.join(__dirname, "database.sqlite");
    const db = new Database(dbPath, { readonly: true });

    const staffId = 73;
    const dayOfWeekId = 6;

    void 0;

    const sql = `
      SELECT
        m.children_id,
        c.name AS children_name,
        m.staff_id,
        m.day_of_week_id,
        m.priority
      FROM managers2 m
      INNER JOIN children c
        ON c.id = m.children_id
      WHERE
        m.staff_id = ?
        AND m.day_of_week_id = ?
        AND c.is_delete = 0
      ORDER BY c.name COLLATE NOCASE
    `;

    const stmt = db.prepare(sql);
    const result = stmt.all(staffId, dayOfWeekId);

    void 0;

    db.close();
  } catch (err) {
    console.error("error:", err.message);
  }
}

main();
