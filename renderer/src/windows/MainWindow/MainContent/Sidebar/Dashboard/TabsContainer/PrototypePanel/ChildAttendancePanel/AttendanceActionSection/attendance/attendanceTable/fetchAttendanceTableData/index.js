/**
 * 利用者テーブル取得（Cache のみ）
 * Google拡張「入退室リクエスト」content.js と同様に hugview 内 fetch で HTML を取得する。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache";
import { fetchAttendanceTableInWebview } from "./fetchAttendanceTableInWebview";

/**
 * @param {string} facility_id
 * @param {string} date_str
 * @param {Object} [options]
 * @param {boolean} [options.showToast]
 * @param {Electron.WebviewTag} [webviewParam]
 */
export async function fetchAttendanceTableData(
  facility_id,
  date_str,
  options = {},
  webviewParam = null
) {
  const { showToast = true } = options;

  try {
    const webview = webviewParam || (await getHugWebviewForCache());

    if (showToast && window.showInfoToast) {
      window.showInfoToast("📥 データ取得中...", 2000);
    }

    const result = await fetchAttendanceTableInWebview(webview, {
      facilityId: String(facility_id),
      dateStr: String(date_str),
    });

    if (!result.ok) {
      throw new Error(result.error || "利用者テーブルの取得に失敗しました");
    }

    if (showToast && window.showSuccessToast) {
      window.showSuccessToast(`✅ データ取得完了\n行数: ${result.rowCount}`, 3000);
    }

    return {
      success: true,
      html: result.html,
      className: result.className,
      rowCount: result.rowCount,
      pageTitle: result.pageTitle,
      pageUrl: result.pageUrl,
      facility_id,
      date_str,
    };
  } catch (error) {
    console.error("❌ [ATTENDANCE] テーブルデータ取得エラー:", error);

    if (showToast && window.showErrorToast) {
      window.showErrorToast(`❌ データ取得失敗\n${error.message}`, 4000);
    }

    return {
      success: false,
      error: error.message,
      html: null,
      facility_id,
      date_str,
    };
  }
}

/**
 * @param {string} [facility_id]
 * @param {string} [date_str]
 * @param {Object} [options]
 */
export async function fetchAttendanceData(
  facility_id = null,
  date_str = null,
  options = {}
) {
  const facilityId = facility_id || options.facilityId || null;
  const dateStr = date_str || options.dateStr || null;

  if (!facilityId || !dateStr) {
    throw new Error("施設IDまたは日付が設定されていません");
  }

  return fetchAttendanceTableData(facilityId, dateStr, options);
}
