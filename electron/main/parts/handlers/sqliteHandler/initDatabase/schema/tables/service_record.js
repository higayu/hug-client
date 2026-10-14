const SQL = `
CREATE TABLE IF NOT EXISTS "service_record" (
	"id"	INTEGER NOT NULL,
	"children_id"	INTEGER NOT NULL,
	"day_of_week_id"	INTEGER NOT NULL,
	"item_id"	INTEGER NOT NULL,
	"served_date"	TEXT NOT NULL,
	"facility_id"	INTEGER NOT NULL,
	"note"	TEXT DEFAULT NULL,
	"is_copy"	INTEGER NOT NULL DEFAULT 0,
	"is_deleted"	INTEGER NOT NULL DEFAULT 0,
	"recorded_staff_id"	INTEGER NOT NULL DEFAULT -1,
	"created_at"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updated_staff_id"	INTEGER NOT NULL DEFAULT -1,
	"updated_at"	TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("children_id","day_of_week_id","item_id","served_date"),
	CONSTRAINT "FK_service_record_day_of_week" FOREIGN KEY("day_of_week_id") REFERENCES "day_of_week"("id") ON DELETE CASCADE,
	CONSTRAINT "service_record_ibfk_1" FOREIGN KEY("item_id") REFERENCES "m_service_items"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_service_record_facilitys" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_service_record_children" FOREIGN KEY("children_id") REFERENCES "children"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
