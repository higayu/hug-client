// main/parts/handlers/sqliteHandler/sqlite/memo.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "memo",
  columns: ["id", "title", "content"],
});