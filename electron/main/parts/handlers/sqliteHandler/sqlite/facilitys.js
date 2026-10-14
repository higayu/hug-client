// main/parts/handlers/sqliteHandler/sqlite/facilitys.js
const { connect } = require("./base");

module.exports = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all("SELECT * FROM facilitys;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.get("SELECT * FROM facilitys WHERE id=?;", [id], (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  insert(data) {
    const { id, name } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run("INSERT INTO facilitys (id, name) VALUES (?, ?);", [id, name], function (err) {
        db.close();
        if (err) return reject(err);
        resolve(this.lastID);
      });
    });
  },

  update(id, data) {
    const { name } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run("UPDATE facilitys SET name=? WHERE id=?;", [name, id], function (err) {
        db.close();
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  },

  delete(id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run("DELETE FROM facilitys WHERE id=?;", [id], function (err) {
        db.close();
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  },
};
