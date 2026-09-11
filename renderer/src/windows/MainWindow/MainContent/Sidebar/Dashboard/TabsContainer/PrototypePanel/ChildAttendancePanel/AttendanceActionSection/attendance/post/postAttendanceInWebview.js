/**
 * 拡張 attendance-post-common.js POST を hugview 内で実行
 */

import { dataListFromEnterButton } from "./enterPost.js";
import { leaveDataListFromOnclick } from "./leavePost.js";

async function postAttendanceDataListInWebview(webview, dataList) {
  const script = `
    (async () => {
      const dataList = ${JSON.stringify(dataList)};
      const WM_BASE = new URL(
        "./",
        "https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail"
      ).href;
      const ajaxUrl = new URL("ajax/ajax_attendance.php", WM_BASE).href;

      try {
        const body = new URLSearchParams();
        for (const [key, value] of Object.entries(dataList)) {
          if (value === undefined || value === null) continue;
          body.append("data_list[" + key + "]", String(value));
        }

        const res = await fetch(ajaxUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest"
          },
          body: body.toString(),
          credentials: "include"
        });

        const text = await res.text();
        let json;
        try {
          json = JSON.parse(text);
        } catch {
          throw new Error(
            "サーバー応答がJSONでありません (" + res.status + "): " + text.slice(0, 200)
          );
        }

        if (!res.ok) {
          throw new Error(
            "ajax_attendance POST失敗 (" + res.status + "): " + JSON.stringify(json)
          );
        }

        return { success: true, dataList, json };
      } catch (e) {
        return {
          success: false,
          error: e && e.message ? String(e.message) : String(e)
        };
      }
    })()
  `;

  try {
    return await webview.executeJavaScript(script);
  } catch (e) {
    return { success: false, error: e?.message ? String(e.message) : String(e) };
  }
}

/** 拡張 nyushitu */
export async function nyushituInWebview(webview, enterOnclick, { mail_flg = 0 } = {}) {
  const dataList = dataListFromEnterButton(enterOnclick, { mail_flg });
  return postAttendanceDataListInWebview(webview, dataList);
}

/** 拡張 taishitsuFromOnclick */
export async function taishitsuFromOnclickInWebview(
  webview,
  leaveOnclick,
  patch
) {
  const dataList = leaveDataListFromOnclick(leaveOnclick, patch);
  if (Number(dataList.attendance_type) !== 2) {
    return { success: false, error: "退室 POST には attendance_type === 2 が必要です" };
  }
  return postAttendanceDataListInWebview(webview, dataList);
}

/** @deprecated 互換 */
export async function postEnterInWebview(webview, enterOnclick, opts = {}) {
  return nyushituInWebview(webview, enterOnclick, opts);
}

/** @deprecated 互換 */
export async function postLeaveInWebview(webview, leaveOnclick, leavePatch) {
  return taishitsuFromOnclickInWebview(webview, leaveOnclick, leavePatch);
}
