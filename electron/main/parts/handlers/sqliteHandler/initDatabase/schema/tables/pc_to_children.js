const SQL = `
CREATE TABLE IF NOT EXISTS "pc_to_children" (
	"id"	INTEGER NOT NULL,
	"pc_id"	INTEGER NOT NULL,
	"children_id"	INTEGER NOT NULL,
	"day_of_week"	INTEGER DEFAULT NULL,
	"start_time"	TEXT DEFAULT NULL,
	"end_time"	TEXT DEFAULT NULL,
	PRIMARY KEY("id" AUTOINCREMENT),
	CONSTRAINT "FK_pc_to_children_day_of_week" FOREIGN KEY("day_of_week") REFERENCES "day_of_week"("id") ON DELETE CASCADE,
	CONSTRAINT "FK__childrenpc" FOREIGN KEY("children_id") REFERENCES "children"("id") ON DELETE CASCADE,
	CONSTRAINT "FK__pc" FOREIGN KEY("pc_id") REFERENCES "pc"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
