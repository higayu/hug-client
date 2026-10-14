const SQL = `
CREATE TABLE IF NOT EXISTS "text_data" (
	"id"	INTEGER NOT NULL,
	"genre"	TEXT NOT NULL,
	"group"	TEXT NOT NULL,
	"sort"	INTEGER NOT NULL,
	"value"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
`;

module.exports = SQL;
