// main/parts/handlers/sqliteHandler/sqlite/base.js
const sqlite3 = require("sqlite3").verbose();
const { getDbPath } = require("../../../utils/pathResolver");

const dbPath = getDbPath();

function connect() {
  return new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("error:", err);
    } else {
      console.log("DB connected:", dbPath);
    }
  });
}

module.exports = { connect };
