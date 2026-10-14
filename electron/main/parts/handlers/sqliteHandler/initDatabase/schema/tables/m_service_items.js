const SQL = `
CREATE TABLE IF NOT EXISTS "m_service_items" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL DEFAULT '',
	PRIMARY KEY("id" AUTOINCREMENT)
);
`;

module.exports = SQL;
