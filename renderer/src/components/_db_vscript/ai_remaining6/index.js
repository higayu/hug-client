const { executeAiV2 } = await require("./runtime");

module.exports = async function execute({ input, config }) {
  return executeAiV2({ input: input || {}, config: config || {} });
};
