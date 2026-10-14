const SQL = `
CREATE TABLE IF NOT EXISTS "temp_notes" (
	"children_id"	INTEGER NOT NULL,
	"staff_id"	INTEGER NOT NULL,
	"day_of_week_id"	INTEGER NOT NULL DEFAULT 0,
	"memo1"	TEXT DEFAULT NULL,
	"memo2"	TEXT DEFAULT NULL,
	"created_at"	TEXT DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	TEXT DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("children_id","staff_id","day_of_week_id"),
	CONSTRAINT "FK_temp_notes_staffs" FOREIGN KEY("staff_id") REFERENCES "staffs"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
	CONSTRAINT "FK_temp_notes_day_of_week" FOREIGN KEY("day_of_week_id") REFERENCES "day_of_week"("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
	CONSTRAINT "FK_temp_notes_children" FOREIGN KEY("children_id") REFERENCES "children"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
);
`;

module.exports = SQL;
