/**
 * HUG attendance POST を webview 内で実行する。
 *
 * DB WebAutomation Rule の config_json.post を受け取り、
 * URL / method / Content-Type / X-Requested-With / credentials / rootKey を
 * DB 定義どおりに使用する。
 */

import { dataListFromEnterButton } from "./enterPost.js";
import { leaveDataListFromOnclick } from "./leavePost.js";

function normalizePostConfig(postConfig = {}) {
  return {
    url: String(postConfig?.url || "ajax/ajax_attendance.php").trim(),
    method: String(postConfig?.method || "POST").trim().toUpperCase(),
    contentType: String(
      postConfig?.contentType ||
        "application/x-www-form-urlencoded; charset=UTF-8"
    ).trim(),
    xRequestedWith: String(
      postConfig?.xRequestedWith || "XMLHttpRequest"
    ).trim(),
    credentials: String(postConfig?.credentials || "include").trim(),
    rootKey: String(postConfig?.rootKey || "data_list").trim(),
  };
}

export async function postAttendanceDataListInWebview(
  webview,
  dataList,
  postConfig = {}
) {
  const normalizedPost = normalizePostConfig(postConfig);

  const script = `
    (async () => {
      const dataList = ${JSON.stringify(dataList)};
      const postConfig = ${JSON.stringify(normalizedPost)};
      const WM_BASE = new URL(
        "./",
        "https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail"
      ).href;
      const ajaxUrl = new URL(postConfig.url, WM_BASE).href;

      try {
        const body = new URLSearchParams();
        for (const [key, value] of Object.entries(dataList)) {
          if (value === undefined || value === null) continue;
          body.append(
            postConfig.rootKey + "[" + key + "]",
            String(value)
          );
        }

        console.log("[Attendance POST][request]", {
          url: ajaxUrl,
          method: postConfig.method,
          postConfig,
          dataList,
          body: body.toString(),
        });

        const res = await fetch(ajaxUrl, {
          method: postConfig.method,
          headers: {
            "Content-Type": postConfig.contentType,
            ...(postConfig.xRequestedWith
              ? { "X-Requested-With": postConfig.xRequestedWith }
              : {}),
          },
          body: body.toString(),
          credentials: postConfig.credentials,
        });

        const text = await res.text();
        const responseMeta = {
          status: res.status,
          statusText: res.statusText,
          url: res.url,
          redirected: res.redirected,
          contentType: res.headers.get("content-type") || "",
          requestId:
            res.headers.get("x-request-id") ||
            res.headers.get("x-correlation-id") ||
            "",
        };

        console.log("[Attendance POST][response]", {
          ...responseMeta,
          responseText: text,
        });

        let json;
        try {
          json = JSON.parse(text);
        } catch {
          console.error("[Attendance POST] non-JSON response", {
            ...responseMeta,
            responseText: text,
            dataList,
            body: body.toString(),
          });

          return {
            success: false,
            error:
              "サーバー応答がJSONでありません (" +
              res.status +
              ")" +
              (responseMeta.contentType
                ? " content-type=" + responseMeta.contentType
                : "") +
              (text ? ": " + text.slice(0, 500) : ": <empty body>"),
            dataList,
            requestBody: body.toString(),
            responseText: text,
            responseMeta,
          };
        }

        if (!res.ok) {
          return {
            success: false,
            error:
              "ajax_attendance POST失敗 (" +
              res.status +
              "): " +
              JSON.stringify(json),
            dataList,
            json,
            requestBody: body.toString(),
            responseText: text,
            responseMeta,
          };
        }

        return {
          success: true,
          dataList,
          json,
          requestBody: body.toString(),
          responseText: text,
          responseMeta,
        };
      } catch (e) {
        return {
          success: false,
          error: e && e.message ? String(e.message) : String(e),
          dataList,
        };
      }
    })()
  `;

  try {
    return await webview.executeJavaScript(script);
  } catch (e) {
    return {
      success: false,
      error: e?.message ? String(e.message) : String(e),
      dataList,
    };
  }
}

/** 旧API互換: 入室 */
export async function nyushituInWebview(
  webview,
  enterOnclick,
  { mail_flg = 0 } = {}
) {
  const dataList = dataListFromEnterButton(enterOnclick, { mail_flg });
  return postAttendanceDataListInWebview(webview, dataList);
}

/** 旧API互換: 退室 */
export async function taishitsuFromOnclickInWebview(
  webview,
  leaveOnclick,
  patch
) {
  const dataList = leaveDataListFromOnclick(leaveOnclick, patch);
  if (Number(dataList.attendance_type) !== 2) {
    return {
      success: false,
      error: "退室 POST には attendance_type === 2 が必要です",
    };
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
