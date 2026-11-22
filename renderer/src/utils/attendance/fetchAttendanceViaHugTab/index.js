import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache";
import { fetchAttendanceTableInWebview } from "./fetchAttendanceTableInWebview";

/**
 * hugview の Cookie だけ使い、ページ遷移なしで利用者テーブルを取得する
 * @param {{ facilityId: string|number, dateStr: string }} opts
 */
export async function fetchAttendanceViaHugTab({ facilityId, dateStr }) {
  const webview = await getHugWebviewForCache();

  if (!facilityId || !dateStr) {
    return {
      ok: false,
      error: "施設IDまたは日付が設定されていません",
    };
  }

  return fetchAttendanceTableInWebview(webview, {
    facilityId: String(facilityId),
    dateStr: String(dateStr),
  });
}
