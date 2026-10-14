const SQL = `
CREATE TABLE IF NOT EXISTS "children_type" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL DEFAULT '0',
	PRIMARY KEY("id")
);
`;

module.exports = SQL;
