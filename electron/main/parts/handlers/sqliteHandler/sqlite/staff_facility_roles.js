// main/parts/handlers/sqliteHandler/sqlite/staff_facility_roles.js

const { createCrudHandler } = require("./crudFactory");

module.exports = createCrudHandler({
  table: "staff_facility_roles",
  columns: [
    "id",
    "staff_id",
    "facility_id",
    "job_name",
    "experience_label",
    "role_note",
    "raw_text",
    "created_at",
    "updated_at",
  ],
});