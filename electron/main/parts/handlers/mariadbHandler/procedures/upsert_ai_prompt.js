const apiClient = require("../../../../../../src/apiClient");

const PROCEDURE_NAME = "upsert_ai_prompt";

function buildParams(data = {}) {
  const promptId = data.prompt_id == null || data.prompt_id === ""
    ? null
    : Number(data.prompt_id);
  const staffId = Number(data.staff_id);
  const itemId = Number(data.item_id);
  const updatedBy = Number(data.updated_by);
  const validActiveValues = [true, false, 1, 0, "1", "0"];

  if (promptId !== null && (!Number.isInteger(promptId) || promptId <= 0)) {
    throw new Error("prompt_idが不正です。");
  }
  if (!Number.isInteger(staffId) || staffId <= 0) {
    throw new Error("staff_idが不正です。");
  }
  if (!Number.isInteger(itemId) || itemId <= 0) {
    throw new Error("item_idが不正です。");
  }
  if (typeof data.content !== "string" || data.content.length === 0) {
    throw new Error("contentが不正です。");
  }
  if (!validActiveValues.includes(data.is_active)) {
    throw new Error("is_activeが不正です。");
  }
  if (!Number.isInteger(updatedBy) || updatedBy <= 0) {
    throw new Error("updated_byが不正です。");
  }

  return [
    promptId,
    staffId,
    itemId,
    data.content,
    data.is_active === true || data.is_active === 1 || data.is_active === "1" ? 1 : 0,
    updatedBy,
  ];
}

async function upsertAiPrompt(data = {}) {
  return apiClient.callProcedure(PROCEDURE_NAME, buildParams(data));
}

module.exports = { PROCEDURE_NAME, buildParams, upsertAiPrompt };
