// main/parts/handlers/sqliteHandler/sqlite/facility_staff.js
const { connect } = require("./base");

module.exports = {
  // 全件取得
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all("SELECT * FROM facility_staff;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // ID指定（複合主キー対応）
  getByIds(facility_id, staff_id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.get(
        "SELECT * FROM facility_staff WHERE facility_id=? AND staff_id=?;",
        [facility_id, staff_id],
        (err, row) => {
          db.close();
          if (err) return reject(err);
          resolve(row);
        }
      );
    });
  },

  // レコード追加
  insert(data) {
    const { facility_id, staff_id } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "INSERT INTO facility_staff (facility_id, staff_id) VALUES (?, ?);",
        [facility_id, staff_id],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  // レコード削除
  delete(facility_id, staff_id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "DELETE FROM facility_staff WHERE facility_id=? AND staff_id=?;",
        [facility_id, staff_id],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  },
};
