const SQL = `
CREATE TABLE IF NOT EXISTS "facility_children" (
	"facility_id"	INTEGER NOT NULL,
	"children_id"	INTEGER NOT NULL,
	PRIMARY KEY("facility_id","children_id"),
	CONSTRAINT "FK__facility" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON DELETE CASCADE,
	CONSTRAINT "FK__childrens" FOREIGN KEY("children_id") REFERENCES "children"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
