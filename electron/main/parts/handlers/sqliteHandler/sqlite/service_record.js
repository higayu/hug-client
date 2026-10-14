// main/parts/handlers/sqliteHandler/sqlite/service_record.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "service_record",
  columns: [
    "id",
    "children_id",
    "day_of_week_id",
    "item_id",
    "served_date",
    "facility_id",
    "note",
    "is_copy",
    "is_deleted",
    "recorded_staff_id",
    "created_at",
    "updated_staff_id",
    "updated_at",
  ],
});