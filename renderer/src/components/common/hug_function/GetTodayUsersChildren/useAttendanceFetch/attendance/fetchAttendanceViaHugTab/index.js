import { executeAttendanceFetchFlow } from "../flow/attendanceFetchFlow";

/**
 * HUGログイン済みWebViewのCookieセッションを使用して、
 * 指定施設・指定日の利用者テーブルを取得する。
 *
 * DB Flow / Rule は使用しない。
 *
 * 戻り値:
 * { ok, html, rowCount, className, pageTitle, pageUrl }
 *
 * @param {{ facilityId: string|number, dateStr: string }} opts
 */
export async function fetchAttendanceViaHugTab({
  facilityId,
  dateStr,
}) {
  if (!facilityId || !dateStr) {
    return {
      ok: false,
      error: "施設IDまたは日付が設定されていません",
    };
  }

  return executeAttendanceFetchFlow({
    facilityId: String(facilityId),
    dateStr: String(dateStr),
  });
}
