const SQL = `
CREATE TABLE IF NOT EXISTS "managers2" (
	"children_id"	INTEGER NOT NULL,
	"facility_id"	INTEGER NOT NULL,
	"staff_id"	INTEGER NOT NULL,
	"day_of_week_id"	INTEGER NOT NULL,
	"priority"	INTEGER NOT NULL DEFAULT 0,
	"support_start_time"	TEXT DEFAULT NULL,
	"support_end_time"	TEXT DEFAULT NULL,
	PRIMARY KEY("children_id","facility_id","staff_id","day_of_week_id"),
	CONSTRAINT "FK_managers2_children" FOREIGN KEY("children_id") REFERENCES "children"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_managers2_facilitys" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_managers2_staffs" FOREIGN KEY("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_managers2_day_of_week" FOREIGN KEY("day_of_week_id") REFERENCES "day_of_week"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
