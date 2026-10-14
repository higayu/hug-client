// main/parts/handlers/sqliteHandler/sqlite/individual_support.js
const { connect } = require("./base");

module.exports = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.all("SELECT * FROM individual_support;", [], (err, rows) => {
        db.close();
        if (err) return reject(err);
        resolve(rows);
      });
    });
  },

  insert(data) {
    const {
      children_id,
      family_intention,
      support_policy,
      long_term_goal,
      short_term_goal,
      support_date,
    } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        `INSERT INTO individual_support 
        (children_id, family_intention, support_policy, long_term_goal, short_term_goal, support_date)
        VALUES (?, ?, ?, ?, ?, ?);`,
        [children_id, family_intention, support_policy, long_term_goal, short_term_goal, support_date],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.lastID);
        }
      );
    });
  },

  update(children_id, data) {
    const {
      family_intention,
      support_policy,
      long_term_goal,
      short_term_goal,
      support_date,
    } = data;
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run(
        `UPDATE individual_support 
         SET family_intention=?, support_policy=?, long_term_goal=?, short_term_goal=?, support_date=? 
         WHERE children_id=?;`,
        [family_intention, support_policy, long_term_goal, short_term_goal, support_date, children_id],
        function (err) {
          db.close();
          if (err) return reject(err);
          resolve(this.changes);
        }
      );
    });
  },

  delete(children_id) {
    return new Promise((resolve, reject) => {
      const db = connect();
      db.run("DELETE FROM individual_support WHERE children_id=?;", [children_id], function (err) {
        db.close();
        if (err) return reject(err);
        resolve(this.changes);
      });
    });
  },
};
