// main/parts/handlers/sqliteHandler/sqlite/child_records.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "child_records",
  columns: [
    "id",
    "children_id",
    "record_type_id",
    "date",
    "score",
    "mistakes",
    "facility_id",
    "memo1",
    "memo2",
    "created_at",
    "updated_at",
  ],
});