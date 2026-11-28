// main/parts/handlers/laravelAuthHandler/procedures/upsertServiceRecordsBulk.js

const laravelApiClient = require("../../../../../../src/laravelApiClient");
const { executeAuthenticatedOperation } = require("../auth/authenticated");
const { formatError, unwrapData } = require("../auth/utils");
const { normalizeStatus } = require("./upsertServiceRecord");

/**
 * 複数児童・複数日分のサービス記録を一括保存する。
 *
 * payload:
 * {
 *   records: [
 *     {
 *       children_id: number,
 *       item_id: number,
 *       served_date: "YYYY-MM-DD",
 *       facility_id: number,
 *       note: string|null,
 *       status?: 1|2|null,
 *       is_fsoaip_corrected?: number,
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
  const records = Array.isArray(payload?.records) ? payload.records : [];
  const saveSyncHistory = [true, 1, "1"].includes(
    payload?.save_sync_history,
  );

  const normalizedPayload = {
    ...payload,
    records: records.map((record) => ({
      ...record,
      status: normalizeStatus(record?.status),
    })),
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

  void 0;

  const result = await executeAuthenticatedOperation(
    () =>
      laravelApiClient.post(
        "/__procedure/upsert-service-records-bulk",
        normalizedPayload,
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
      authenticated: true,
      reauthenticated: result?.meta?.reauthenticated ?? false,
      requestedCount: records.length,
    },
    error: null,
  };
}

const handler = async (_event, payload = {}) => {
  try {
    const result = await upsertServiceRecordsBulk(payload);

    if (result?.success) {
      void 0;
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
