// main/parts/handlers/laravelAuthHandler/procedures/upsertManagers2.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
// ★ 修正: ./auth ではなく ./auth/authenticated から直接インポート
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

async function upsertManagers2(payload = {}) {
  const request = {
    is_active: 1,
    ...payload,
  };

  console.log("📤 [Laravel Procedure] upsertManagers2:", request);

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.upsertManagers2(request),
    "マネージャー設定の保存に失敗しました。"
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "マネージャー設定を保存しました。",
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
    console.log("📤 [Laravel Procedure] IPC upsertManagers2:", payload);

    const result = await upsertManagers2(payload);

    if (result.success) {
      console.log("✅ [Laravel Procedure] upsertManagers2 DONE:", result.data);
    } else {
      console.error("❌ [Laravel Procedure] upsertManagers2 failed:", result);
    }

    return result;
  } catch (error) {
    console.error("❌ [Laravel Procedure] upsertManagers2 error:", error);
    return formatError(error, "マネージャー設定の保存に失敗しました。");
  }
};

module.exports = {
  upsertManagers2,
  handler,
};
