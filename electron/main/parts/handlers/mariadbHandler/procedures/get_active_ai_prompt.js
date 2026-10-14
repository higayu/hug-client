const apiClient = require("../../../../../../src/apiClient");

const PROCEDURE_NAME = "get_active_ai_prompt";

function buildParams(data = {}) {
  const staffId = Number(data.staff_id);
  const itemId = data.item_id == null || data.item_id === ""
    ? null
    : Number(data.item_id);

  if (!Number.isInteger(staffId) || staffId <= 0) {
    throw new Error("staff_idが不正です。");
  }

  if (itemId !== null && (!Number.isInteger(itemId) || itemId <= 0)) {
    throw new Error("item_idが不正です。");
  }

  return [staffId, itemId];
}

async function getActiveAiPrompt(data = {}) {
  return apiClient.callProcedure(PROCEDURE_NAME, buildParams(data));
}

module.exports = { PROCEDURE_NAME, buildParams, getActiveAiPrompt };
