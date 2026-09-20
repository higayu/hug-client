import { getWeekdayIdFromDate } from "@/utils/date/dateUtils.js";

/** 個人記録（活動内容）の item_id は固定 1（個人記録テーブル.md） */
export const SERVICE_RECORD_ITEM_ID = 1;

const HUG_WM_ORIGIN = "https://www.hug-ayumu.link/hug/wm/";

/**
 * 編集ページ URL から cal_date（YYYY-MM-DD）を取得
 * @param {string} editPath
 */
export function parseCalDateFromEditPath(editPath) {
  if (!editPath) return null;
  try {
    const url = new URL(editPath, HUG_WM_ORIGIN);
    const cal = url.searchParams.get("cal_date");
    return cal && /^\d{4}-\d{2}-\d{2}$/.test(cal) ? cal : null;
  } catch {
    return null;
  }
}

/**
 * 一覧行の日付表示 or cal_date から YYYY-MM-DD
 * @param {string} dateText
 * @param {string} [editPath]
 */
export function resolveRecordDate(dateText, editPath) {
  const fromPath = parseCalDateFromEditPath(editPath);
  if (fromPath) return fromPath;

  const m = String(dateText || "").match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
  if (!m) return null;

  const y = m[1];
  const mo = String(m[2]).padStart(2, "0");
  const d = String(m[3]).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/**
 * HUG 取得レコード 1 件 → service_record POST 用 payload
 *
 * @param {object} record fetchPersonalRecordList の records 要素
 * @param {{ childrenId: string|number, facilityId: string|number, staffId?: string|number }} ctx
 */
export function buildServiceRecordPayload(record, { childrenId, facilityId, staffId }) {
  const dateStr = resolveRecordDate(record?.date, record?.editPath);
  if (!dateStr) {
    throw new Error(`日付を解釈できません: ${record?.date ?? ""}`);
  }

  const dayOfWeekId = getWeekdayIdFromDate(dateStr);
  if (!dayOfWeekId) {
    throw new Error(`曜日IDを取得できません: ${dateStr}`);
  }

  if (record?.permissionError === true) {
    throw new Error(
      record?.noteError || "編集権限がないため活動内容（note）を取得できません"
    );
  }

  if (record?.noteError) {
    throw new Error(record.noteError);
  }

  const note = (record?.note ?? "").trim();
  if (!note) {
    throw new Error("活動内容（note）が空です");
  }

  const recordedStaffId = record?.recordStaff?.value
    ? Number(record.recordStaff.value)
    : staffId
      ? Number(staffId)
      : -1;
  const updatedStaffId = staffId ? Number(staffId) : recordedStaffId;

  return {
    children_id: Number(childrenId),
    item_id: SERVICE_RECORD_ITEM_ID,
    facility_id: Number(facilityId),
    served_date: dateStr,
    day_of_week_id: dayOfWeekId,
    note,
    is_copy: 0,
    is_deleted: 0,
    recorded_staff_id: recordedStaffId,
    updated_staff_id: updatedStaffId,
  };
}

/** ローカル API が重複（HTTP 409）で拒否したか */
export function isServiceRecordDuplicateError(message) {
  const text = String(message ?? "");
  return /\b409\b/.test(text) || /status code 409/i.test(text);
}

/**
 * 取得した個人記録を UpsertServiceRecord プロシージャ経由でローカル DB へ保存
 *
 * @param {Array<object>} records
 * @param {{ childrenId: string|number, facilityId: string|number, staffId?: string|number }} ctx
 * @returns {Promise<{
 *   ok: boolean;
 *   posted: number;
 *   skipped: number;
 *   failed: number;
 *   results: Array<{
 *     date?: string;
 *     ok: boolean;
 *     payload?: object;
 *     data?: unknown;
 *     error?: string;
 *     skipped?: boolean;
 *   }>;
 * }>}
 */
export async function postServiceRecordsToLocalApi(records, ctx) {
  const { childrenId, facilityId, staffId } = ctx || {};

  if (!childrenId || !facilityId) {
    return {
      ok: false,
      posted: 0,
      skipped: 0,
      failed: 0,
      permissionErrors: [],
      hasPermissionError: false,
      results: [{ ok: false, error: "childrenId / facilityId が指定されていません" }],
    };
  }

  if (!window.electronAPI?.mariadb_service_record_upsert) {
    return {
      ok: false,
      posted: 0,
      skipped: 0,
      failed: 0,
      permissionErrors: [],
      hasPermissionError: false,
      results: [
        { ok: false, error: "mariadb_service_record_upsert が利用できません" },
      ],
    };
  }

  const list = Array.isArray(records) ? records : [];
  const results = [];
  let posted = 0;
  let skipped = 0;
  let failed = 0;
  const permissionErrors = [];

  for (const record of list) {
    const dateLabel = record?.date ?? parseCalDateFromEditPath(record?.editPath);

    // 権限不足で note を取得できなかったレコードはDBへ保存しない。
    // 失敗ではなく skipped として扱い、permissionError を結果に残す。
    if (record?.permissionError === true) {
      const message =
        record?.noteError ||
        "編集権限がないため活動内容（note）を取得できません";

      skipped += 1;

      const permissionError = {
        date: dateLabel,
        message,
      };
      permissionErrors.push(permissionError);

      results.push({
        date: dateLabel,
        ok: false,
        skipped: true,
        permissionError: true,
        error: message,
      });

      console.warn(
        "[postServiceRecordsToLocalApi] 権限不足のためDB保存をスキップ:",
        permissionError
      );

      continue;
    }

    try {
      const payload = buildServiceRecordPayload(record, {
        childrenId,
        facilityId,
        staffId,
      });

      const data = await window.electronAPI.mariadb_service_record_upsert(
        payload
      );

      posted += 1;
      results.push({ date: dateLabel, ok: true, payload, data });
    } catch (e) {
      const message = e?.message ? String(e.message) : String(e);

      const isPermissionError =
        message.includes("編集権限") ||
        message.includes("権限がありません") ||
        message.includes("編集権限がない");

      if (isPermissionError) {
        skipped += 1;

        const permissionError = {
          date: dateLabel,
          message,
        };
        permissionErrors.push(permissionError);

        results.push({
          date: dateLabel,
          ok: false,
          skipped: true,
          permissionError: true,
          error: message,
        });

        continue;
      }

      const isSkip =
        message.includes("活動内容（note）が空") ||
        message.includes("日付を解釈");

      if (isSkip) {
        skipped += 1;
        results.push({ date: dateLabel, ok: false, error: message, skipped: true });
      } else {
        failed += 1;
        results.push({ date: dateLabel, ok: false, error: message });
      }
    }
  }

  return {
    ok: failed === 0,
    posted,
    skipped,
    failed,
    permissionErrors,
    hasPermissionError: permissionErrors.length > 0,
    results,
  };
}
