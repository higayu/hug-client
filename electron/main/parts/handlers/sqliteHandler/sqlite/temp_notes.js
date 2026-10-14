// main/parts/handlers/sqliteHandler/sqlite/temp_notes.js
const { connect } = require("./base");

module.exports = {
  // =====================================
  // 全件取得
  // =====================================
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();

      db.all("SELECT * FROM temp_notes;", [], (err, rows) => {
        db.close();

        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // =====================================
  // 一時メモを取得
  // children_id + staff_id + day_of_week_id で1件取得
  // =====================================
  getTempNote(children_id, staff_id, day_of_week_id) {
    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        SELECT *
        FROM temp_notes
        WHERE children_id = ?
          AND staff_id = ?
          AND day_of_week_id = ?
        LIMIT 1;
      `;

      db.get(sql, [children_id, staff_id, day_of_week_id], (err, row) => {
        db.close();

        if (err) return reject(err);
        resolve(row || null);
      });
    });
  },

  // =====================================
  // memo1 / memo2 両方 upsert
  // MariaDB側の主キー:
  // children_id + staff_id + day_of_week_id に合わせる
  // =====================================
  upsert(data) {
    const { children_id, staff_id, day_of_week_id, memo1, memo2 } = data;

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        INSERT INTO temp_notes (
          children_id,
          staff_id,
          day_of_week_id,
          memo1,
          memo2
        )
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(children_id, staff_id, day_of_week_id) DO UPDATE SET
          memo1 = excluded.memo1,
          memo2 = excluded.memo2,
          updated_at = CURRENT_TIMESTAMP;
      `;

      db.run(
        sql,
        [
          children_id,
          staff_id,
          day_of_week_id,
          memo1 ?? "",
          memo2 ?? "",
        ],
        function (err) {
          db.close();

          if (err) return reject(err);

          resolve({
            success: true,
            changes: this.changes,
            lastID: this.lastID,
          });
        }
      );
    });
  },

  // =====================================
  // memo1 upsert
  // =====================================
  upsert1(data) {
    const { children_id, staff_id, day_of_week_id, memo1 } = data;

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        INSERT INTO temp_notes (
          children_id,
          staff_id,
          day_of_week_id,
          memo1
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(children_id, staff_id, day_of_week_id) DO UPDATE SET
          memo1 = excluded.memo1,
          updated_at = CURRENT_TIMESTAMP;
      `;

      db.run(
        sql,
        [
          children_id,
          staff_id,
          day_of_week_id,
          memo1 ?? "",
        ],
        function (err) {
          db.close();

          if (err) return reject(err);

          resolve({
            success: true,
            changes: this.changes,
            lastID: this.lastID,
          });
        }
      );
    });
  },

  // =====================================
  // memo2 upsert
  // =====================================
  upsert2(data) {
    const { children_id, staff_id, day_of_week_id, memo2 } = data;

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        INSERT INTO temp_notes (
          children_id,
          staff_id,
          day_of_week_id,
          memo2
        )
        VALUES (?, ?, ?, ?)
        ON CONFLICT(children_id, staff_id, day_of_week_id) DO UPDATE SET
          memo2 = excluded.memo2,
          updated_at = CURRENT_TIMESTAMP;
      `;

      db.run(
        sql,
        [
          children_id,
          staff_id,
          day_of_week_id,
          memo2 ?? "",
        ],
        function (err) {
          db.close();

          if (err) return reject(err);

          resolve({
            success: true,
            changes: this.changes,
            lastID: this.lastID,
          });
        }
      );
    });
  },
};