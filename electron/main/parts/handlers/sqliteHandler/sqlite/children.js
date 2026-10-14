// main/parts/handlers/sqliteHandler/sqlite/children.js
const { connect } = require("./base");

module.exports = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all("SELECT * FROM children;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  getById(id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.get("SELECT * FROM children WHERE id = ?;", [id], (err, row) => {
        db.close();
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  insert(data) {
    const {
      id,
      name,
      furigana,
      notes,
      notes2,
      personal_tmp,
      pronunciation_id,
      children_type_id,
      is_delete,
      leaving_at,
    } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "INSERT INTO children (id, name, furigana, notes, notes2, personal_tmp, pronunciation_id, children_type_id, is_delete, leaving_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);",
        [
          id,
          name,
          furigana,
          notes,
          notes2,
          personal_tmp,
          pronunciation_id,
          children_type_id,
          is_delete,
          leaving_at,
        ],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  update(id, data) {
    const {
      name,
      furigana,
      notes,
      notes2,
      personal_tmp,
      pronunciation_id,
      children_type_id,
      is_delete,
      leaving_at,
    } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        "UPDATE children SET name=?, furigana=?, notes=?, notes2=?, personal_tmp=?, pronunciation_id=?, children_type_id=?, is_delete=?, leaving_at=? WHERE id=?;",
        [
          name,
          furigana,
          notes,
          notes2,
          personal_tmp,
          pronunciation_id,
          children_type_id,
          is_delete,
          leaving_at,
          id,
        ],
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
      db.run("DELETE FROM children WHERE id = ?;", [id], function (err) {
        db.close();
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  },
};