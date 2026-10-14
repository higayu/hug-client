const SQL = `
CREATE TABLE IF NOT EXISTS "pc" (
	"id"	INTEGER NOT NULL,
	"facility_id"	INTEGER NOT NULL,
	"pc_id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL DEFAULT '',
	"explanation"	TEXT DEFAULT NULL,
	"memo"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	UNIQUE("facility_id","pc_id"),
	CONSTRAINT "FK_pc_facilitys" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON DELETE NO ACTION
);
`;

module.exports = SQL;
