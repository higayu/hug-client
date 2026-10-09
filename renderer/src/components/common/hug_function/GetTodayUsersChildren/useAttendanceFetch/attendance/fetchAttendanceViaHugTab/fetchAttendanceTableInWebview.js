import { executeAttendanceFetchFlow } from "../flow/attendanceFetchFlow";

/**
 * 指定WebViewを使用して今日の利用者テーブルを取得する。
 *
 * DB Flow / Rule は使用せず、Renderer内の
 * executeAttendanceFetchFlow() を直接実行する。
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
    return {
      ok: false,
      error: "施設IDまたは日付がありません",
    };
  }

  return executeAttendanceFetchFlow({
    webview,
    facilityId: String(facilityId),
    dateStr: String(dateStr),
  });
}
