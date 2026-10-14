// main/parts/handlers/sqliteHandler/initDatabase/seeds/seedDayOfWeek.js

const { runSql } = require("../helpers");

async function seedDayOfWeek(db) {
  const rows = [
    [1, "月", "Mon", 1],
    [2, "火", "Tue", 2],
    [3, "水", "Wed", 3],
    [4, "木", "Thu", 4],
    [5, "金", "Fri", 5],
    [6, "土", "Sat", 6],
    [7, "日", "Sun", 7],
  ];

  for (const row of rows) {
    await runSql(
      db,
      `
        INSERT OR REPLACE INTO "day_of_week"
          ("id", "label_jp", "label_en", "sort_order")
        VALUES (?, ?, ?, ?)
      `,
      row
    );
  }
}

module.exports = { seedDayOfWeek };