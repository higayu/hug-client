const SQL = `
CREATE TABLE IF NOT EXISTS "individual_support" (
	"children_id"	INTEGER,
	"family_intention"	TEXT,
	"support_policy"	TEXT,
	"long_term_goal"	TEXT,
	"short_term_goal"	TEXT,
	"support_date"	TEXT,
	"created_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	"updated_at"	DATETIME DEFAULT CURRENT_TIMESTAMP,
	PRIMARY KEY("children_id")
);
`;

module.exports = SQL;
