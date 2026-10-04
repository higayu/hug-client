import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache";

const HUG_WM_BASE_URL = "https://www.hug-ayumu.link/hug/wm/";

/**
 * HUG本体と同じ編集画面URLを生成する。
 *
 * 例:
 * attendance.php?mode=edit&id=47534&s_id=1
 */
export function buildAttendanceEditUrl({
  editUrl = "",
  attendanceId = "",
  serviceId = "",
} = {}) {
  if (editUrl) {
    return String(editUrl).replace(/&amp;/g, "&");
  }

  if (!attendanceId || !serviceId) {
    throw new Error("編集画面に必要な id または s_id がありません");
  }

  const params = new URLSearchParams({
    mode: "edit",
    id: String(attendanceId),
    s_id: String(serviceId),
  });

  return `attendance.php?${params.toString()}`;
}

/**
 * HUG WebView 内で location.href を使用して編集画面へGET遷移する。
 *
 * HUG本体の
 * onclick="location.href='attendance.php?mode=edit&id=...&s_id=...'"
 * と同じ方式。
 */
export async function openAttendanceEditPage(options = {}) {
  const targetUrl = buildAttendanceEditUrl(options);
  const webview = options.webview || (await getHugWebviewForCache());

  if (!webview) {
    throw new Error("HUG WebViewを取得できませんでした");
  }

  const absoluteUrl = new URL(targetUrl, HUG_WM_BASE_URL).href;

  await webview.executeJavaScript(`
    (() => {
      const targetUrl = ${JSON.stringify(absoluteUrl)};
      console.log("[Attendance Edit] location.href GET:", targetUrl);
      location.href = targetUrl;
      return targetUrl;
    })();
  `);

  return {
    success: true,
    targetUrl: absoluteUrl,
  };
}

// 旧関数名を使用している箇所があっても壊れないよう残す。
export const OpenEditModal = openAttendanceEditPage;
