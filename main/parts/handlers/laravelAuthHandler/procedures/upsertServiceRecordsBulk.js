// main/parts/handlers/laravelAuthHandler/procedures/upsertServiceRecordsBulk.js

const laravelApiClient = require("../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");

/**
 * 複数児童・複数日分のサービス記録をLaravelへ一括保存する。
 *
 * payload:
 * {
 *   records: [
 *     {
 *       children_id: number,
 *       item_id: number,
 *       served_date: string,
 *       facility_id: number,
 *       note: string,
 *       is_copy?: number,
 *       is_deleted?: number,
 *     }
 *   ],
 *   recorded_staff_id: number,
 *   updated_staff_id: number,
 * }
 */
async function upsertServiceRecordsBulk(payload = {}) {
  console.log("📤 [Laravel Procedure] upsertServiceRecordsBulk:", {
    recordCount: Array.isArray(payload?.records) ? payload.records.length : 0,
    recorded_staff_id: payload?.recorded_staff_id,
    updated_staff_id: payload?.updated_staff_id,
  });

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.post(
        "/__procedure/upsert-service-records-bulk",
        payload,
      ),
    "サービス記録の一括保存に失敗しました。",
  );

  if (result?.success === false) {
    return result;
  }

  return {
    success: true,
    connected: true,
    message: "サービス記録を一括保存しました。",
    data: unwrapData(result),
    meta: {
      ...(result?.meta ?? {}),
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
    },
    error: null,
  };
}

const handler = async (_event, payload = {}) => {
  try {
    const result = await upsertServiceRecordsBulk(payload);

    if (result?.success) {
      console.log(
        "✅ [Laravel Procedure] upsertServiceRecordsBulk DONE:",
        result.data,
      );
    } else {
      console.error(
        "❌ [Laravel Procedure] upsertServiceRecordsBulk failed:",
        result,
      );
    }

    return result;
  } catch (error) {
    console.error(
      "❌ [Laravel Procedure] upsertServiceRecordsBulk error:",
      error,
    );

    return formatError(
      error,
      "サービス記録の一括保存に失敗しました。",
    );
  }
};

module.exports = {
  upsertServiceRecordsBulk,
  handler,
};
