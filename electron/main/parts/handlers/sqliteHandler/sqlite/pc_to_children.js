// main/parts/handlers/sqliteHandler/sqlite/pc_to_children.js
const { connect } = require("./base");

module.exports = {
  // ======================================
  // 全件取得
  // ======================================
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all("SELECT * FROM pc_to_children;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // ======================================
  // 新規追加（INSERT）
  // ======================================
  insert(data) {
    const { pc_id, children_id, day_of_week, start_time, end_time } = data;

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        INSERT INTO pc_to_children
        (pc_id, children_id, day_of_week, start_time, end_time)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.run(
        sql,
        [
          pc_id,
          children_id,
          day_of_week ?? null,     // 数値 or null
          start_time ?? null,      // TEXT or null
          end_time ?? null         // TEXT or null
        ],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve({ id: this.lastID });
        }
      );
    });
  },

  // ======================================
  // 更新（UPDATE）
  // ======================================
  update(id, data) {
    const { pc_id, children_id, day_of_week, start_time, end_time } = data;

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        UPDATE pc_to_children
        SET pc_id = ?,
            children_id = ?,
            day_of_week = ?,
            start_time = ?,
            end_time = ?
        WHERE id = ?
      `;

      db.run(
        sql,
        [
          pc_id,
          children_id,
          day_of_week ?? null,
          start_time ?? null,
          end_time ?? null,
          id
        ],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve({ changes: this.changes });
        }
      );
    });
  },

  // ======================================
  // 削除（DELETE）
  // ======================================
  delete(id) {
    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `DELETE FROM pc_to_children WHERE id = ?`;

      db.run(sql, [id], function (err) {
        db.close();
        if (err) return reject(err);
        resolve({ changes: this.changes });
      });
    });
  },
};

