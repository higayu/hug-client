const { connect } = require("./base");

function getAll() {
    const db = connect();
    return new Promise((resolve, reject) => {
      db.all("SELECT * FROM pronunciation", [], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
        db.close((closeErr) => {
          if (closeErr) console.error("DB close error:", closeErr);
        });
      });
    });
  }
  

module.exports = { getAll };
