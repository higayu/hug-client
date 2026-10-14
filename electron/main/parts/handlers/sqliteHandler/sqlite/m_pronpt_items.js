const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "m_pronpt_items",
  columns: ["id", "name"],
  primaryKey: "id",
});
