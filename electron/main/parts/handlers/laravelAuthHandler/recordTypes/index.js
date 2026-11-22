// main/parts/handlers/laravelAuthHandler/recordTypes/index.js
const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

async function getAllHandler(_event, params = {}) {
  try {
    const rawId = params?.facility_id ?? params?.facilityId;
    const facilityId = Number(rawId);
    if (rawId === undefined || rawId === null || String(rawId).trim() === "" ||
        !Number.isSafeInteger(facilityId) || facilityId <= 0) {
      throw new Error("facility_idは1以上の整数で指定してください。");
    }

    const result = await executeAuthenticatedOperation(
      () => laravelApiClient.get("/record-types", {
        params: { facility_id: facilityId },
      }),
      "課題タイプ一覧の取得に失敗しました。"
    );

    if (result?.success === false) return result;
    const data = unwrapData(result);
    if (!Array.isArray(data)) {
      return {
        success: false,
        connected: true,
        message: "課題タイプ一覧の応答形式が正しくありません。",
        data: null,
        meta: { authenticated: true },
        error: { code: "INVALID_RECORD_TYPES_RESPONSE" },
      };
    }
    return {
      success: true,
      connected: true,
      message: "課題タイプ一覧を取得しました。",
      data,
      meta: {
        ...(result?.meta ?? {}),
        authenticated: true,
        facility_id: facilityId,
      },
      error: null,
    };
  } catch (error) {
    return formatError(error, "課題タイプ一覧の取得に失敗しました。");
  }
}

module.exports = { getAllHandler };
