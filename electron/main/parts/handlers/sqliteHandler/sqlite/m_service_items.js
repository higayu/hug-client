// main/parts/handlers/sqliteHandler/sqlite/m_service_items.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "m_service_items",
  columns: ["id", "name"],
});