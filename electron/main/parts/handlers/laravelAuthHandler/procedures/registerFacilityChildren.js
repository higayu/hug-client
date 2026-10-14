// main/parts/handlers/laravelAuthHandler/procedures/registerFacilityChildren.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");  // 修正
const { formatError, unwrapData } = require("../auth/utils");

async function registerFacilityChildren(payload = {}) {
  console.log("📤 [Laravel Procedure] registerFacilityChildren:", payload);

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.registerFacilityChildren(payload),
    "児童データの同期に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "児童データを同期しました。",
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
    console.log("📤 [Laravel Procedure] IPC registerFacilityChildren:", payload);

    const result = await registerFacilityChildren(payload);

    if (result.success) {
      console.log("✅ [Laravel Procedure] registerFacilityChildren DONE:", result.data);
    } else {
      console.error("❌ [Laravel Procedure] registerFacilityChildren failed:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ [Laravel Procedure] registerFacilityChildren error:", error);
    return formatError(error, "児童データの同期に失敗しました。");
  }
};

module.exports = {
  registerFacilityChildren,
  handler,
};