import { executeAttendanceFetchFlow } from "../flow/attendanceFetchFlow";

/**
 * DBの attendance_fetch_today_users Flow を使用して、
 * HUGログイン済みWebViewのCookieセッションで利用者テーブルを取得する。
 *
 * 戻り値の形はDB化前と同じ:
 * { ok, html, rowCount, className, pageTitle, pageUrl }
 *
 * @param {{ facilityId: string|number, dateStr: string }} opts
 */
export async function fetchAttendanceViaHugTab({ facilityId, dateStr }) {
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
