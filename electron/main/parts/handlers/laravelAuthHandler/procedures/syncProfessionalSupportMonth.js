// main/parts/handlers/laravelAuthHandler/procedures/syncProfessionalSupportMonth.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

/**
 * 専門的支援ウィンドウの月次データをLaravelへ同期する。
 *
 * payload:
 * {
 *   facilityId: number,
 *   year: number,
 *   month: number,
 *   attendanceData: array,
 *   additionData: array,
 *   recordData: array,
 * }
 */
async function syncProfessionalSupportMonth(payload = {}) {
  void 0;

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.post(
        "/__procedure/sync-professional-support-month",
        payload,
      ),
    "専門的支援の月次データ同期に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "専門的支援の月次データを同期しました。",
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
    const result = await syncProfessionalSupportMonth(payload);

    if (result?.success) {
      void 0;
    } else {
      console.error(
        "❌ [Laravel Procedure] syncProfessionalSupportMonth failed:",
        result,
      );
    }

    return result;
  } catch (error) {
    console.error(
      "❌ [Laravel Procedure] syncProfessionalSupportMonth error:",
      error,
    );

    return formatError(
      error,
      "専門的支援の月次データ同期に失敗しました。",
    );
  }
};

module.exports = {
  syncProfessionalSupportMonth,
  handler,
};
