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
 *   save_sync_history?: boolean | 0 | 1,
 *   sync_facility_id?: number | null,
 *   target_year?: number | null,
 *   target_month?: number | null,
 * }
 */
async function upsertServiceRecordsBulk(payload = {}) {
  const saveSyncHistory = [true, 1, "1"].includes(
    payload?.save_sync_history,
  );

  const requestPayload = {
    ...payload,
    records: Array.isArray(payload?.records) ? payload.records : [],
    save_sync_history: saveSyncHistory ? 1 : 0,
    sync_facility_id: saveSyncHistory
      ? Number(payload?.sync_facility_id) || null
      : null,
    target_year: saveSyncHistory
      ? Number(payload?.target_year) || null
      : null,
    target_month: saveSyncHistory
      ? Number(payload?.target_month) || null
      : null,
  };

  console.log("📤 [Laravel Procedure] upsertServiceRecordsBulk:", {
    recordCount: requestPayload.records.length,
    recorded_staff_id: requestPayload.recorded_staff_id,
    updated_staff_id: requestPayload.updated_staff_id,
    save_sync_history: requestPayload.save_sync_history,
    sync_facility_id: requestPayload.sync_facility_id,
    target_year: requestPayload.target_year,
    target_month: requestPayload.target_month,
  });

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.post(
        "/__procedure/upsert-service-records-bulk",
        requestPayload,
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
