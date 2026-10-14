// main/parts/handlers/sqliteHandler/sqlite/record_types.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "record_types",
  columns: ["id", "name", "memo"],
});