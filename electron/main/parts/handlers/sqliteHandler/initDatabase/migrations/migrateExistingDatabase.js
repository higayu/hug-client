// main/parts/handlers/sqliteHandler/initDatabase/migrations/migrateExistingDatabase.js

const { ensureColumn } = require("../helpers");

/**
 * 既存DB向け migration
 *
 * CREATE TABLE IF NOT EXISTS は既存テーブルを変更しないため、
 * 既存DBには ALTER TABLE ADD COLUMN を実行する。
 *
 * SQLite は PRIMARY KEY や NOT NULL を後付けしにくいため、
 * 既存DB向け追加カラムは基本的に nullable / default 付きにする。
 */
async function migrateExistingDatabase(db) {
    // children
    await ensureColumn(db, "children", "name", `"name" TEXT`);
    await ensureColumn(db, "children", "furigana", `"furigana" TEXT`);
    await ensureColumn(db, "children", "notes", `"notes" TEXT`);
    await ensureColumn(db, "children", "notes2", `"notes2" TEXT`);
    await ensureColumn(db, "children", "personal_tmp", `"personal_tmp" TEXT`);
    await ensureColumn(db, "children", "pronunciation_id", `"pronunciation_id" INTEGER`);
    await ensureColumn(db, "children", "children_type_id", `"children_type_id" INTEGER DEFAULT 1`);
    await ensureColumn(db, "children", "is_delete", `"is_delete" INTEGER DEFAULT 0`);
    await ensureColumn(db, "children", "leaving_at", `"leaving_at" TEXT`);
  
    // children_type
    await ensureColumn(db, "children_type", "name", `"name" TEXT`);
  
    // pronunciation
    await ensureColumn(db, "pronunciation", "pronunciation", `"pronunciation" TEXT`);
  
    // day_of_week
    await ensureColumn(db, "day_of_week", "label_jp", `"label_jp" TEXT`);
    await ensureColumn(db, "day_of_week", "label_en", `"label_en" TEXT`);
    await ensureColumn(db, "day_of_week", "sort_order", `"sort_order" INTEGER`);
  
    // facilitys
    await ensureColumn(db, "facilitys", "name", `"name" TEXT`);
    await ensureColumn(db, "facilitys", "url", `"url" TEXT`);
  
    // facility_children
    await ensureColumn(db, "facility_children", "facility_id", `"facility_id" INTEGER`);
    await ensureColumn(db, "facility_children", "children_id", `"children_id" INTEGER`);
  
    // facility_staff
    await ensureColumn(db, "facility_staff", "facility_id", `"facility_id" INTEGER`);
    await ensureColumn(db, "facility_staff", "staff_id", `"staff_id" INTEGER`);
  
    // staffs
    await ensureColumn(db, "staffs", "name", `"name" TEXT`);
    await ensureColumn(db, "staffs", "work_style", `"work_style" TEXT`);
    await ensureColumn(db, "staffs", "notes", `"notes" TEXT`);
    await ensureColumn(db, "staffs", "is_delete", `"is_delete" INTEGER DEFAULT 0`);
    await ensureColumn(db, "staffs", "admin", `"admin" INTEGER`);
    await ensureColumn(db, "staffs", "display_order", `"display_order" INTEGER`);
    await ensureColumn(db, "staffs", "entered_at", `"entered_at" TEXT`);
    await ensureColumn(db, "staffs", "leaving_at", `"leaving_at" TEXT`);
    await ensureColumn(db, "staffs", "hug_updated_at", `"hug_updated_at" TEXT`);
    await ensureColumn(db, "staffs", "hug_updated_by", `"hug_updated_by" TEXT`);
  
    // staff_facility_roles
    await ensureColumn(db, "staff_facility_roles", "staff_id", `"staff_id" INTEGER`);
    await ensureColumn(db, "staff_facility_roles", "facility_id", `"facility_id" INTEGER`);
    await ensureColumn(db, "staff_facility_roles", "job_name", `"job_name" TEXT`);
    await ensureColumn(db, "staff_facility_roles", "experience_label", `"experience_label" TEXT`);
    await ensureColumn(db, "staff_facility_roles", "role_note", `"role_note" TEXT`);
    await ensureColumn(db, "staff_facility_roles", "raw_text", `"raw_text" TEXT`);
    await ensureColumn(db, "staff_facility_roles", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "staff_facility_roles", "updated_at", `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
  
    // managers2
    await ensureColumn(db, "managers2", "children_id", `"children_id" INTEGER`);
    await ensureColumn(db, "managers2", "facility_id", `"facility_id" INTEGER DEFAULT 1`);
    await ensureColumn(db, "managers2", "staff_id", `"staff_id" INTEGER`);
    await ensureColumn(db, "managers2", "day_of_week_id", `"day_of_week_id" INTEGER`);
    await ensureColumn(db, "managers2", "priority", `"priority" INTEGER DEFAULT 0`);
    await ensureColumn(db, "managers2", "support_start_time", `"support_start_time" TEXT DEFAULT NULL`);
    await ensureColumn(db, "managers2", "support_end_time", `"support_end_time" TEXT DEFAULT NULL`);
  
    // pc
    await ensureColumn(db, "pc", "facility_id", `"facility_id" INTEGER`);
    await ensureColumn(db, "pc", "pc_id", `"pc_id" INTEGER`);
    await ensureColumn(db, "pc", "name", `"name" TEXT`);
    await ensureColumn(db, "pc", "explanation", `"explanation" TEXT`);
    await ensureColumn(db, "pc", "memo", `"memo" TEXT`);
  
    // pc_to_children
    await ensureColumn(db, "pc_to_children", "pc_id", `"pc_id" INTEGER`);
    await ensureColumn(db, "pc_to_children", "children_id", `"children_id" INTEGER`);
    await ensureColumn(db, "pc_to_children", "day_of_week", `"day_of_week" INTEGER`);
    await ensureColumn(db, "pc_to_children", "start_time", `"start_time" TEXT`);
    await ensureColumn(db, "pc_to_children", "end_time", `"end_time" TEXT`);
  
    // record_types
    await ensureColumn(db, "record_types", "name", `"name" TEXT`);
    await ensureColumn(db, "record_types", "memo", `"memo" TEXT`);
  
    // child_records
    await ensureColumn(db, "child_records", "children_id", `"children_id" INTEGER`);
    await ensureColumn(db, "child_records", "record_type_id", `"record_type_id" INTEGER`);
    await ensureColumn(db, "child_records", "date", `"date" TEXT`);
    await ensureColumn(db, "child_records", "score", `"score" INTEGER`);
    await ensureColumn(db, "child_records", "mistakes", `"mistakes" INTEGER`);
    await ensureColumn(db, "child_records", "facility_id", `"facility_id" INTEGER`);
    await ensureColumn(db, "child_records", "memo1", `"memo1" TEXT`);
    await ensureColumn(db, "child_records", "memo2", `"memo2" TEXT`);
    await ensureColumn(db, "child_records", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "child_records", "updated_at", `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
  
    // m_service_items
    await ensureColumn(db, "m_service_items", "name", `"name" TEXT`);
  
    // service_record
    await ensureColumn(db, "service_record", "children_id", `"children_id" INTEGER`);
    await ensureColumn(db, "service_record", "day_of_week_id", `"day_of_week_id" INTEGER`);
    await ensureColumn(db, "service_record", "item_id", `"item_id" INTEGER`);
    await ensureColumn(db, "service_record", "served_date", `"served_date" TEXT`);
    await ensureColumn(db, "service_record", "facility_id", `"facility_id" INTEGER`);
    await ensureColumn(db, "service_record", "note", `"note" TEXT`);
    await ensureColumn(db, "service_record", "is_copy", `"is_copy" INTEGER DEFAULT 0`);
    await ensureColumn(db, "service_record", "is_deleted", `"is_deleted" INTEGER DEFAULT 0`);
    await ensureColumn(db, "service_record", "recorded_staff_id", `"recorded_staff_id" INTEGER DEFAULT -1`);
    await ensureColumn(db, "service_record", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "service_record", "updated_staff_id", `"updated_staff_id" INTEGER DEFAULT -1`);
    await ensureColumn(db, "service_record", "updated_at", `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
  
    // memo
    await ensureColumn(db, "memo", "title", `"title" TEXT`);
    await ensureColumn(db, "memo", "content", `"content" TEXT`);
  
    // text_data
    await ensureColumn(db, "text_data", "genre", `"genre" TEXT`);
    await ensureColumn(db, "text_data", "group", `"group" TEXT`);
    await ensureColumn(db, "text_data", "sort", `"sort" INTEGER`);
    await ensureColumn(db, "text_data", "value", `"value" TEXT`);
  
    // toolbox
    await ensureColumn(db, "toolbox", "title", `"title" TEXT`);
    await ensureColumn(db, "toolbox", "description", `"description" TEXT`);
    await ensureColumn(db, "toolbox", "layout", `"layout" TEXT`);
    await ensureColumn(db, "toolbox", "is_tools", `"is_tools" INTEGER DEFAULT 1`);
    await ensureColumn(db, "toolbox", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "toolbox", "updated_at", `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "toolbox", "permission", `"permission" INTEGER DEFAULT 0`);
    await ensureColumn(db, "toolbox", "facility_id", `"facility_id" INTEGER`);
  
    // users
    await ensureColumn(db, "users", "name", `"name" TEXT`);
    await ensureColumn(db, "users", "email", `"email" TEXT`);
    await ensureColumn(db, "users", "password", `"password" TEXT`);
    await ensureColumn(db, "users", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "users", "leaving_at", `"leaving_at" TEXT`);
  
    // refresh_tokens
    await ensureColumn(db, "refresh_tokens", "user_id", `"user_id" INTEGER`);
    await ensureColumn(db, "refresh_tokens", "token", `"token" TEXT`);
    await ensureColumn(db, "refresh_tokens", "revoked", `"revoked" INTEGER DEFAULT 0`);
    await ensureColumn(db, "refresh_tokens", "expires_at", `"expires_at" DATETIME`);
    await ensureColumn(db, "refresh_tokens", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
  
    // individual_support
    await ensureColumn(db, "individual_support", "family_intention", `"family_intention" TEXT`);
    await ensureColumn(db, "individual_support", "support_policy", `"support_policy" TEXT`);
    await ensureColumn(db, "individual_support", "long_term_goal", `"long_term_goal" TEXT`);
    await ensureColumn(db, "individual_support", "short_term_goal", `"short_term_goal" TEXT`);
    await ensureColumn(db, "individual_support", "support_date", `"support_date" TEXT`);
    await ensureColumn(db, "individual_support", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "individual_support", "updated_at", `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
  
    // temp_notes
    await ensureColumn(db, "temp_notes", "children_id", `"children_id" INTEGER`);
    await ensureColumn(db, "temp_notes", "staff_id", `"staff_id" INTEGER`);
    await ensureColumn(db, "temp_notes", "day_of_week_id", `"day_of_week_id" INTEGER`);
    await ensureColumn(db, "temp_notes", "memo1", `"memo1" TEXT`);
    await ensureColumn(db, "temp_notes", "memo2", `"memo2" TEXT`);
    await ensureColumn(db, "temp_notes", "created_at", `"created_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
    await ensureColumn(db, "temp_notes", "updated_at", `"updated_at" DATETIME DEFAULT CURRENT_TIMESTAMP`);
  }

module.exports = { migrateExistingDatabase };