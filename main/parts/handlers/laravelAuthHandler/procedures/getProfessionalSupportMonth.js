// main/parts/handlers/laravelAuthHandler/procedures/getProfessionalSupportMonth.js

const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

/**
 * 専門的支援の月次比較データをLaravelから取得する。
 *
 * payload:
 * {
 *   facilityId: number,
 *   year: number,
 *   month: number,
 * }
 */
async function getProfessionalSupportMonth(payload = {}) {
  console.log("📥 [Laravel Procedure] getProfessionalSupportMonth:", {
    facilityId: payload?.facilityId,
    year: payload?.year,
    month: payload?.month,
  });

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.post(
        "/__procedure/get-professional-support-month",
        payload,
      ),
    "専門的支援の月次比較データ取得に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "専門的支援の月次比較データを取得しました。",
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
    const result = await getProfessionalSupportMonth(payload);

    if (result?.success) {
      const count = Array.isArray(result?.data)
        ? result.data.length
        : Array.isArray(result?.data?.data)
          ? result.data.data.length
          : undefined;

      console.log(
        "✅ [Laravel Procedure] getProfessionalSupportMonth DONE:",
        { count },
      );
    } else {
      console.error(
        "❌ [Laravel Procedure] getProfessionalSupportMonth failed:",
        result,
      );
    }

    return result;
  } catch (error) {
    console.error(
      "❌ [Laravel Procedure] getProfessionalSupportMonth error:",
      error,
    );

    return formatError(
      error,
      "専門的支援の月次比較データ取得に失敗しました。",
    );
  }
};

module.exports = {
  getProfessionalSupportMonth,
  handler,
};
