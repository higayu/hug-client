// main/parts/handlers/sqliteHandler/sqlite/toolbox.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "toolbox",
  columns: [
    "id",
    "title",
    "description",
    "layout",
    "is_tools",
    "created_at",
    "updated_at",
    "permission",
    "facility_id",
  ],
});