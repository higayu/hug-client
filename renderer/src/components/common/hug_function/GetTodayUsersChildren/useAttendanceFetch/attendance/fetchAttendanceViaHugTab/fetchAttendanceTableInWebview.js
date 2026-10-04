import { executeAttendanceFetchFlow } from "../flow/attendanceFetchFlow";

/**
 * 互換用ラッパー。
 * 旧実装はURL/selector/login判定をこのファイルにハードコードしていたが、
 * 現在は attendance_fetch_today_users のFlow/RuleをDBから取得して実行する。
 *
 * @param {Electron.WebviewTag} webview
 * @param {{ facilityId: string, dateStr: string }} opts
 */
export async function fetchAttendanceTableInWebview(webview, opts) {
  const { facilityId, dateStr } = opts || {};

  if (!webview) {
    return { ok: false, error: "webview がありません" };
  }
  if (!facilityId || !dateStr) {
    return { ok: false, error: "施設IDまたは日付がありません" };
  }

  return executeAttendanceFetchFlow({
    webview,
    facilityId: String(facilityId),
    dateStr: String(dateStr),
  });
}
