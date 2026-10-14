const SQL = `
CREATE TABLE IF NOT EXISTS "day_of_week" (
	"id"	INTEGER NOT NULL,
	"label_jp"	TEXT NOT NULL,
	"label_en"	TEXT DEFAULT NULL,
	"sort_order"	INTEGER NOT NULL,
	PRIMARY KEY("id")
);
`;

module.exports = SQL;
