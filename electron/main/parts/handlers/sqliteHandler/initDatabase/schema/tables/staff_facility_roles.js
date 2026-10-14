const SQL = `
CREATE TABLE IF NOT EXISTS "staff_facility_roles" (
	"id"	INTEGER NOT NULL,
	"staff_id"	INTEGER NOT NULL,
	"facility_id"	INTEGER NOT NULL,
	"job_name"	TEXT NOT NULL,
	"experience_label"	TEXT DEFAULT NULL,
	"role_note"	TEXT DEFAULT NULL,
	"raw_text"	TEXT DEFAULT NULL,
	"created_at"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("staff_id","facility_id","job_name","experience_label"),
	CONSTRAINT "fk_staff_facility_roles_staffs" FOREIGN KEY("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE,
	CONSTRAINT "fk_staff_facility_roles_facilitys" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
