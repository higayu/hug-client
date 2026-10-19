// preload/tables.js

const sharedTables = [
  "children",
  "children_type",
  "day_of_week",
  "facility_children",
  "facility_staff",
  "facilitys",
  "individual_support",
  "managers2",
  "pc",
  "pc_to_children",
  "pronunciation",
  "staffs",
  "service_record",
  "temp_notes",
  "record_types",
  "child_records",
  "m_service_items",
  "staff_facility_roles",
  "memo",
];

const aiPromptTables = [
  "m_pronpt_items",
  "ai_prompts",
  "ai_prompt_histories",
];

const sqliteTables = [...sharedTables];
const mariadbTables = [...sharedTables, ...aiPromptTables];
// Laravelの会社別権限は取得専用。SQLite・MariaDBのスキーマは変更しない。
const roleTables = ["companies", "roles", "company_roles", "company_staff"];
const laravelTables = [...sharedTables.filter((name) => name !== "record_types"), ...aiPromptTables, ...roleTables];

module.exports = {
  sqliteTables,
  mariadbTables,
  laravelTables,
};
