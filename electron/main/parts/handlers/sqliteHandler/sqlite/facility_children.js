// main/parts/handlers/sqliteHandler/sqlite/facility_children.js
const { connect } = require("./base");

module.exports = {
  // 全件取得
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all("SELECT * FROM facility_children;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  // 特定の施設の子ども一覧を取得
  getByFacilityId(facility_id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all(
        "SELECT * FROM facility_children WHERE facility_id=?;",
        [facility_id],
        (err, rows) => {
          db.close();
          if (err) return reject(err);
          resolve(rows);
        }
      );
    });
  },

  // レコード追加
  insert(data) {
    const { facility_id, children_id } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "INSERT INTO facility_children (facility_id, children_id) VALUES (?, ?);",
        [facility_id, children_id],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  // レコード削除
  delete(facility_id, children_id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "DELETE FROM facility_children WHERE facility_id=? AND children_id=?;",
        [facility_id, children_id],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  },
};
