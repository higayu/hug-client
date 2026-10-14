const SQL = `
CREATE TABLE IF NOT EXISTS "record_types" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	"memo"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
`;

module.exports = SQL;
