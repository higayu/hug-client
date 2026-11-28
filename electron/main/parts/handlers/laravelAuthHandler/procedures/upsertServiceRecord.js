// main/parts/handlers/laravelAuthHandler/procedures/upsertServiceRecord.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");  // 修正
const { formatError, unwrapData } = require("../auth/utils");

function normalizeStatus(value) {
  if (value === 1 || value === "1" || value === "公開" || value === "公開中") {
    return 1;
  }

  if (value === 2 || value === "2" || value === "下書き") {
    return 2;
  }

  return null;
}

async function upsertServiceRecord(payload = {}) {
  const normalizedPayload = {
    ...payload,
    status: normalizeStatus(payload?.status),
  };

  void 0;

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.upsertServiceRecord(normalizedPayload),
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
    void 0;

    const result = await upsertServiceRecord(payload);

    if (result.success) {
      void 0;
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
  normalizeStatus,
  upsertServiceRecord,
  handler,
};
