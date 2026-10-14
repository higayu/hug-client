const SQL = `
CREATE TABLE IF NOT EXISTS "facilitys" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT DEFAULT NULL,
	"url"	TEXT DEFAULT NULL,
	PRIMARY KEY("id")
);
`;

module.exports = SQL;
