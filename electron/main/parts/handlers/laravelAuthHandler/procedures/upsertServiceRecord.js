// main/parts/handlers/laravelAuthHandler/procedures/upsertServiceRecord.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");  // 修正
const { formatError, unwrapData } = require("../auth/utils");

async function upsertServiceRecord(payload = {}) {
  console.log("📤 [Laravel Procedure] upsertServiceRecord:", payload);

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.upsertServiceRecord(payload),
    "サービス記録の保存に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "サービス記録を保存しました。",
    data: unwrapData(result),
    meta: {
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

const handler = async (_event, payload = {}) => {
  try {
    console.log("📤 [Laravel Procedure] IPC upsertServiceRecord:", payload);

    const result = await upsertServiceRecord(payload);

    if (result.success) {
      console.log("✅ [Laravel Procedure] upsertServiceRecord DONE:", result.data);
    } else {
      console.error("❌ [Laravel Procedure] upsertServiceRecord failed:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ [Laravel Procedure] upsertServiceRecord error:", error);
    return formatError(error, "サービス記録の保存に失敗しました。");
  }
};

module.exports = {
  upsertServiceRecord,
  handler,
};