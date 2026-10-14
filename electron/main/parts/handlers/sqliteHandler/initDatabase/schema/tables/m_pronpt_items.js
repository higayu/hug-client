const SQL = `
CREATE TABLE IF NOT EXISTS "m_pronpt_items" (
  "id" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  PRIMARY KEY("id" AUTOINCREMENT)
);
`;

module.exports = SQL;
