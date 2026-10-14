// main/parts/handlers/sqliteHandler/sqlite/crudFactory.js

const { connect } = require("./base");

function createCrudHandler({ table, columns, primaryKey = "id" }) {
  return {
    getAll() {
      return new Promise((resolve, reject) => {
        const db = connect();

        db.all(`SELECT * FROM "${table}";`, [], (err, rows) => {
          db.close();
          if (err) return reject(err);
          resolve(rows);
        });
      });
    },

    getById(id) {
      return new Promise((resolve, reject) => {
        const db = connect();

        db.get(
          `SELECT * FROM "${table}" WHERE "${primaryKey}" = ?;`,
          [id],
          (err, row) => {
            db.close();
            if (err) return reject(err);
            resolve(row || null);
          }
        );
      });
    },

    insert(data) {
      return new Promise((resolve, reject) => {
        const db = connect();

        const insertColumns = columns.filter((col) => data[col] !== undefined);

        if (insertColumns.length === 0) {
          db.close();
          return reject(new Error(`[${table}] insert data is empty`));
        }

        const columnSql = insertColumns.map((col) => `"${col}"`).join(", ");
        const placeholders = insertColumns.map(() => "?").join(", ");
        const values = insertColumns.map((col) => data[col]);

        db.run(
          `INSERT INTO "${table}" (${columnSql}) VALUES (${placeholders});`,
          values,
          function (err) {
            db.close();
            if (err) return reject(err);
            resolve({ id: this.lastID, changes: this.changes });
          }
        );
      });
    },

    update(id, data) {
      return new Promise((resolve, reject) => {
        const db = connect();

        const updateColumns = columns.filter(
          (col) => col !== primaryKey && data[col] !== undefined
        );

        if (updateColumns.length === 0) {
          db.close();
          return reject(new Error(`[${table}] update data is empty`));
        }

        const setSql = updateColumns.map((col) => `"${col}" = ?`).join(", ");
        const values = updateColumns.map((col) => data[col]);

        db.run(
          `UPDATE "${table}" SET ${setSql} WHERE "${primaryKey}" = ?;`,
          [...values, id],
          function (err) {
            db.close();
            if (err) return reject(err);
            resolve({ changes: this.changes });
          }
        );
      });
    },

    delete(id) {
      return new Promise((resolve, reject) => {
        const db = connect();

        db.run(
          `DELETE FROM "${table}" WHERE "${primaryKey}" = ?;`,
          [id],
          function (err) {
            db.close();
            if (err) return reject(err);
            resolve({ changes: this.changes });
          }
        );
      });
    },
  };
}

module.exports = { createCrudHandler };