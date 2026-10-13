const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

async function handler(_event, params = {}) {
  try {
    const facilityId = Number(params?.facility_id ?? params?.facilityId);
    if (!Number.isSafeInteger(facilityId) || facilityId <= 0) {
      throw new Error("facility_idは1以上の整数で指定してください。");
    }

    const result = await executeAuthenticatedOperation(
      () => laravelApiClient.get("/record-types", {
        params: { facility_id: facilityId },
      }),
      "児童課題タイプの取得に失敗しました。",
    );
    if (result?.success === false) return result;

    const data = unwrapData(result);
    if (!Array.isArray(data)) {
      throw new Error("児童課題タイプのレスポンスが配列ではありません。");
    }

    return {
      success: true,
      connected: true,
      message: "児童課題タイプを取得しました。",
      data,
      meta: {
        ...(result?.meta ?? {}),
        authenticated: true,
        facility_id: facilityId,
      },
      error: null,
    };
  } catch (error) {
    return formatError(error, "児童課題タイプの取得に失敗しました。");
  }
}

module.exports = { handler };
