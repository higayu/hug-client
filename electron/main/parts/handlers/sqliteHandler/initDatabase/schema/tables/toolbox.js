const SQL = `
CREATE TABLE IF NOT EXISTS "toolbox" (
	"id"	INTEGER NOT NULL,
	"title"	TEXT NOT NULL,
	"description"	TEXT DEFAULT NULL,
	"layout"	TEXT NOT NULL CHECK(json_valid("layout")),
	"is_tools"	INTEGER NOT NULL DEFAULT 1,
	"created_at"	TEXT DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	TEXT DEFAULT CURRENT_TIMESTAMP,
	"permission"	INTEGER NOT NULL DEFAULT 0,
	"facility_id"	INTEGER NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	CONSTRAINT "FK_toolbox_facilitys" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON UPDATE CASCADE
);
`;

module.exports = SQL;
