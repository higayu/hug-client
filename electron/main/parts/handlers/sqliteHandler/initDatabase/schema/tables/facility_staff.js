const SQL = `
CREATE TABLE IF NOT EXISTS "facility_staff" (
	"facility_id"	INTEGER NOT NULL,
	"staff_id"	INTEGER NOT NULL,
	PRIMARY KEY("facility_id","staff_id"),
	CONSTRAINT "FK_facility_staff_facilitys" FOREIGN KEY("facility_id") REFERENCES "facilitys"("id") ON DELETE CASCADE,
	CONSTRAINT "FK_facility_staff_staffs" FOREIGN KEY("staff_id") REFERENCES "staffs"("id") ON DELETE CASCADE
);
`;

module.exports = SQL;
