const INDEXES_SQL = `























CREATE INDEX IF NOT EXISTS "idx_children_pronunciation_id"
ON "children" ("pronunciation_id");

CREATE INDEX IF NOT EXISTS "idx_children_children_type_id"
ON "children" ("children_type_id");

CREATE INDEX IF NOT EXISTS "idx_child_records_children_id"
ON "child_records" ("children_id");

CREATE INDEX IF NOT EXISTS "idx_child_records_record_type_id"
ON "child_records" ("record_type_id");

CREATE INDEX IF NOT EXISTS "idx_child_records_facility_id"
ON "child_records" ("facility_id");

CREATE INDEX IF NOT EXISTS "idx_facility_children_children_id"
ON "facility_children" ("children_id");

CREATE INDEX IF NOT EXISTS "idx_facility_staff_staff_id"
ON "facility_staff" ("staff_id");

CREATE INDEX IF NOT EXISTS "idx_managers2_staff_id"
ON "managers2" ("staff_id");

CREATE INDEX IF NOT EXISTS "idx_managers2_day_of_week_id"
ON "managers2" ("day_of_week_id");

CREATE INDEX IF NOT EXISTS "idx_managers2_facility_id"
ON "managers2" ("facility_id");

CREATE INDEX IF NOT EXISTS "idx_pc_facility_id"
ON "pc" ("facility_id");

CREATE INDEX IF NOT EXISTS "idx_pc_to_children_children_id"
ON "pc_to_children" ("children_id");

CREATE INDEX IF NOT EXISTS "idx_pc_to_children_pc_id"
ON "pc_to_children" ("pc_id");

CREATE INDEX IF NOT EXISTS "idx_pc_to_children_day_of_week"
ON "pc_to_children" ("day_of_week");

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_staff_id"
ON "refresh_tokens" ("staff_id");

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_expires_at"
ON "refresh_tokens" ("expires_at");

CREATE INDEX IF NOT EXISTS "idx_refresh_tokens_revoked_at"
ON "refresh_tokens" ("revoked_at");

CREATE INDEX IF NOT EXISTS "idx_staffs_role_id"
ON "staffs" ("role_id");

CREATE INDEX IF NOT EXISTS "idx_service_record_item_id"
ON "service_record" ("item_id");

CREATE INDEX IF NOT EXISTS "idx_service_record_day_of_week_id"
ON "service_record" ("day_of_week_id");

CREATE INDEX IF NOT EXISTS "idx_service_record_facility_id"
ON "service_record" ("facility_id");

CREATE INDEX IF NOT EXISTS "idx_staff_facility_roles_staff_id"
ON "staff_facility_roles" ("staff_id");

CREATE INDEX IF NOT EXISTS "idx_staff_facility_roles_facility_id"
ON "staff_facility_roles" ("facility_id");

CREATE INDEX IF NOT EXISTS "idx_temp_notes_staff_id"
ON "temp_notes" ("staff_id");

CREATE INDEX IF NOT EXISTS "idx_temp_notes_day_of_week_id"
ON "temp_notes" ("day_of_week_id");

CREATE INDEX IF NOT EXISTS "idx_toolbox_facility_id"
ON "toolbox" ("facility_id");

CREATE INDEX IF NOT EXISTS "idx_temp_notes_children_day_lookup"
ON "temp_notes" ("children_id", "day_of_week_id");

CREATE UNIQUE INDEX IF NOT EXISTS "idx_temp_notes_children_staff_day" ON "temp_notes" ("children_id","staff_id","day_of_week_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_facility_children_ids" ON "facility_children" ("facility_id","children_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_facility_staff_ids" ON "facility_staff" ("facility_id","staff_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_managers2_ids" ON "managers2" ("children_id","facility_id","staff_id","day_of_week_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_pc_facility_pc_id" ON "pc" ("facility_id","pc_id");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_service_record_unique" ON "service_record" ("children_id","day_of_week_id","item_id","served_date");
CREATE UNIQUE INDEX IF NOT EXISTS "idx_staff_facility_roles_unique" ON "staff_facility_roles" ("staff_id","facility_id","job_name","experience_label");

`;

module.exports = { INDEXES_SQL };
