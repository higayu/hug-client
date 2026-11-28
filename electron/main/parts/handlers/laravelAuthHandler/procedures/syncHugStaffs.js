// main/parts/handlers/laravelAuthHandler/procedures/syncHugStaffs.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");  // 修正
const { formatError, unwrapData } = require("../auth/utils");

async function syncHugStaffs(payload = {}) {
  void 0;

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.syncHugStaffs(payload),
    "職員データの同期に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "職員データを同期しました。",
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
    void 0;

    const result = await syncHugStaffs(payload);

    if (result.success) {
      void 0;
    } else {
      console.error("❌ [Laravel Procedure] syncHugStaffs failed:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ [Laravel Procedure] syncHugStaffs error:", error);
    return formatError(error, "職員データの同期に失敗しました。");
  }
};

module.exports = {
  syncHugStaffs,
  handler,
};