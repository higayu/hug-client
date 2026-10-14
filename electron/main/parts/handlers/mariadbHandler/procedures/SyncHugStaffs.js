const apiClient = require("../../../../../../src/apiClient");

const PROCEDURE_NAME = "sync_hug_staffs";

function validateHugStaffResult(result) {
  if (!result || typeof result !== "object") {
    throw new Error("送信データが不正です。職員データを取得し直してください。");
  }

  if (!Array.isArray(result.staff) || result.staff.length === 0) {
    throw new Error("送信する職員データがありません。");
  }

  return result;
}

async function syncHugStaffs(result) {
  const safeResult = validateHugStaffResult(result);

  try {
    return await apiClient.callProcedure(PROCEDURE_NAME, [
      JSON.stringify(safeResult),
    ]);
  } catch (error) {
    console.error("syncHugStaffs ERROR:", error);
    throw error;
  }
}

module.exports = {
  PROCEDURE_NAME,
  syncHugStaffs,
  validateHugStaffResult,
};
