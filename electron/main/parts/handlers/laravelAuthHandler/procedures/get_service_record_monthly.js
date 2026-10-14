// main/parts/handlers/laravelAuthHandler/procedures/get_service_record_monthly.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

async function getServiceRecordMonthly(payload = {}) {
  console.log("📤 [Laravel Procedure] getServiceRecordMonthly:", payload);

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.getServiceRecordMonthly(payload),
    "月次サービス記録の取得に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "月次サービス記録を取得しました。",
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
    return await getServiceRecordMonthly(payload);
  } catch (error) {
    console.error(
      "❌ [Laravel Procedure] getServiceRecordMonthly error:",
      error,
    );

    return formatError(error, "月次サービス記録の取得に失敗しました。");
  }
};

module.exports = {
  getServiceRecordMonthly,
  handler,
};
