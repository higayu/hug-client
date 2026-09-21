const laravelApiClient = require("../../../../../src/laravelApiClient");
const {
  executeAuthenticatedOperation,
} = require("../auth/authenticated");
const {
  formatError,
  unwrapData,
} = require("../auth/utils");

function normalizePositiveInteger(value, label) {
  const normalized = Number(value);

  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error(`${label}は1以上の整数で指定してください。`);
  }

  return normalized;
}

function normalizeParams(params = {}) {
  const facilityId = normalizePositiveInteger(
    params?.facility_id ?? params?.facilityId,
    "施設ID",
  );
  const targetYear = normalizePositiveInteger(
    params?.target_year ?? params?.year,
    "対象年",
  );
  const targetMonth = normalizePositiveInteger(
    params?.target_month ?? params?.month,
    "対象月",
  );
  const itemId = normalizePositiveInteger(
    params?.item_id ?? params?.itemId ?? 1,
    "記録種別ID",
  );

  if (targetYear < 2000 || targetYear > 2100) {
    throw new Error("対象年は2000から2100の範囲で指定してください。");
  }

  if (targetMonth > 12) {
    throw new Error("対象月は1から12の範囲で指定してください。");
  }

  return {
    facility_id: facilityId,
    target_year: targetYear,
    target_month: targetMonth,
    item_id: itemId,
  };
}

async function getPersonalRecordSyncMonth(params = {}) {
  const query = normalizeParams(params);

  console.log("📥 [Laravel PersonalRecordSync] get month:", query);

  const result = await executeAuthenticatedOperation(
    () => laravelApiClient.get("/personal-record-syncs", { params: query }),
    "個人記録の一括同期履歴取得に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: result?.message ?? "個人記録の一括同期履歴を取得しました。",
    data: unwrapData(result),
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

async function getMonthHandler(_event, params = {}) {
  try {
    const result = await getPersonalRecordSyncMonth(params);

    if (result?.success) {
      console.log("✅ [Laravel PersonalRecordSync] get month DONE:", {
        exists: result?.meta?.exists ?? Boolean(result?.data),
        syncedAt:
          result?.data?.synced_at ??
          result?.meta?.synced_at ??
          null,
      });
    } else {
      console.error(
        "❌ [Laravel PersonalRecordSync] get month failed:",
        result,
      );
    }

    return result;
  } catch (error) {
    console.error(
      "❌ [Laravel PersonalRecordSync] get month error:",
      error,
    );

    return formatError(
      error,
      "個人記録の一括同期履歴取得に失敗しました。",
    );
  }
}

module.exports = {
  normalizeParams,
  getPersonalRecordSyncMonth,
  getMonthHandler,
};
