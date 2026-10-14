// main/parts/handlers/sqliteHandler/sqlite/day_of_week.js
const { connect } = require("./base");

/**
 * JSON.parse を安全に行うヘルパー
 * main プロセスでは必須
 */
function safeJsonParse(value, fallback = null) {
  if (value == null || value === "") {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch (err) {
    console.warn("⚠️ [day_of_week] JSON parse failed:", value);
    return fallback;
  }
}

module.exports = {
  // =======================================================
  // day_of_week 全件取得
  // =======================================================
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();

      db.all("SELECT * FROM day_of_week;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);

        const parsed = rows.map(r => ({
          ...r,
          // ★ ここを安全化
          days: safeJsonParse(r.days, []),
        }));

        resolve(parsed);
      });
    });
  },

  // =======================================================
  // 1件取得（children_id & staff_id）
  // =======================================================
  getOne(children_id, staff_id) {
    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        SELECT * FROM day_of_week
        WHERE children_id = ? AND staff_id = ?
        LIMIT 1
      `;

      db.get(sql, [children_id, staff_id], (err, row) => {
        db.close();
        if (err) return reject(err);

        if (!row) return resolve(null);

        // ★ ここも安全化
        row.days = safeJsonParse(row.days, []);

        resolve(row);
      });
    });
  },

  // =======================================================
  // upsert（INSERT or UPDATE）
  // =======================================================
  upsert(data) {
    const { children_id, staff_id, days } = data;

    if (!Array.isArray(days)) {
      return Promise.reject(new Error("days must be an array"));
    }

    const jsonDays = JSON.stringify(days);

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        INSERT INTO day_of_week (children_id, staff_id, days)
        VALUES (?, ?, ?)
        ON CONFLICT(children_id, staff_id) DO UPDATE SET
          days = excluded.days
      `;

      db.run(sql, [children_id, staff_id, jsonDays], function (err) {
        db.close();
        if (err) return reject(err);

        resolve({ success: true, changes: this.changes });
      });
    });
  },

  // =======================================================
  // 削除
  // =======================================================
  delete(children_id, staff_id) {
    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        DELETE FROM day_of_week
        WHERE children_id = ? AND staff_id = ?
      `;

      db.run(sql, [children_id, staff_id], function (err) {
        db.close();
        if (err) return reject(err);

        resolve({ success: true, changes: this.changes });
      });
    });
  },
};
