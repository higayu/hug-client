const SQL = `
CREATE TABLE IF NOT EXISTS "pronunciation" (
	"id"	INTEGER NOT NULL,
	"pronunciation"	TEXT NOT NULL,
	PRIMARY KEY("id" AUTOINCREMENT)
);
`;

module.exports = SQL;
