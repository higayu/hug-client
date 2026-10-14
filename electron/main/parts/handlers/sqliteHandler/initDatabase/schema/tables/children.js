const SQL = `
CREATE TABLE IF NOT EXISTS "children" (
	"id"	INTEGER NOT NULL,
	"name"	TEXT NOT NULL,
	"furigana"	TEXT DEFAULT NULL,
	"notes"	TEXT DEFAULT NULL,
	"notes2"	TEXT DEFAULT NULL,
	"personal_tmp"	TEXT DEFAULT NULL,
	"pronunciation_id"	INTEGER DEFAULT NULL,
	"children_type_id"	INTEGER NOT NULL DEFAULT 1,
	"is_delete"	INTEGER NOT NULL DEFAULT 0,
	"leaving_at"	TEXT DEFAULT NULL,
	PRIMARY KEY("id"),
	CONSTRAINT "FK_children_children_type" FOREIGN KEY("children_type_id") REFERENCES "children_type"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_children_pronunciation" FOREIGN KEY("pronunciation_id") REFERENCES "pronunciation"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
