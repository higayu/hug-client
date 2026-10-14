const { TABLE_NAMES } = require("./tableOrder");
const { INDEXES_SQL } = require("./core");
const { TRIGGERS_SQL } = require("./triggers");
const { AI_PROMPT_INDEXES_SQL } = require("./aiPromptIndexes");

const tableSql = TABLE_NAMES.map((tableName) =>
  require(`./tables/${tableName}`),
).join("\n");

const INIT_SQL = `
BEGIN TRANSACTION;
${tableSql}
${TRIGGERS_SQL}
${AI_PROMPT_INDEXES_SQL}
${INDEXES_SQL}
COMMIT;
`;

module.exports = { INIT_SQL };
