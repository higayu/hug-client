// main/parts/handlers/sqliteHandler/sqlite/pc.js
const { connect } = require("./base");

module.exports = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all("SELECT * FROM pc;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.get("SELECT * FROM pc WHERE id=?;", [id], (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  insert(data) {
    const { id, name, explanation, memo, facility_id } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "INSERT INTO pc (id, name, explanation, memo, facility_id) VALUES (?, ?, ?, ?, ?);",
        [id, name, explanation, memo, facility_id],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  update(id, data) {
    const { name, explanation, memo, facility_id } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "UPDATE pc SET name=?, explanation=?, memo=?, facility_id=? WHERE id=?;",
        [name, explanation, memo, facility_id, id],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run("DELETE FROM pc WHERE id=?;", [id], function (err) {
        db.close();
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  },
};
