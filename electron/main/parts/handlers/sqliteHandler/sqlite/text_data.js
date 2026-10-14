// main/parts/handlers/sqliteHandler/sqlite/text_data.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "text_data",
  columns: ["id", "genre", "group", "sort", "value"],
});