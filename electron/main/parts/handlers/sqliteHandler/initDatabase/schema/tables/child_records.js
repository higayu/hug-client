const SQL = `
CREATE TABLE IF NOT EXISTS "child_records" (
	"id"	INTEGER NOT NULL,
	"children_id"	INTEGER NOT NULL,
	"record_type_id"	INTEGER NOT NULL,
	"date"	TEXT NOT NULL,
	"score"	INTEGER DEFAULT NULL,
	"mistakes"	INTEGER DEFAULT NULL,
	"facility_id"	INTEGER NOT NULL,
	"memo1"	TEXT DEFAULT NULL,
	"memo2"	TEXT DEFAULT NULL,
	"created_at"	TEXT DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	TEXT DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("id" AUTOINCREMENT),
	CONSTRAINT "FK_child_records_facilitys" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_child_records_record_types" FOREIGN KEY("record_type_id") REFERENCES "record_types"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_child_records_children" FOREIGN KEY("children_id") REFERENCES "children"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
