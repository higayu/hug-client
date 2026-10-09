import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache";

const FLOW_KEY = "attendance_fetch_today_users";
const RULE_KEY = "attendance_fetch_today_users";

/**
 * 今日の利用者取得設定。
 *
 * 以前DBの web_automation_rules.config_json に保存していた内容を、
 * 一旦Renderer側へ戻して直接使用する。
 */
const ATTENDANCE_FETCH_CONFIG = {
  request: {
    url: "https://www.hug-ayumu.link/hug/wm/attendance.php",
    method: "GET",
    credentials: "include",
    query: {
      mode: "detail",
    },
  },

  loginCheck: {
    enabled: true,
    loginInputSelector: 'input[name="username"]',
    titleContains: "ログイン",
    htmlContains: "login.php",
  },

  table: {
    primarySelector:
      "table.sortTable01:not(.sortTableAdding):not(.js_adding_table)",
    fallbackSelector: "table",
    bodySelector: "tbody",
  },

  columns: {
    childInfo: 1,
    edit: 4,
    enter: 5,
    leave: 6,
  },

  child: {
    idQueryParameter: "id",
    nameSelector: "p",
  },

  attendance: {
    timePattern: "^\\d{2}:\\d{2}$",
    enterTextKey: "column5",
    enterHtmlKey: "column5Html",
    leaveTextKey: "column6",
    leaveHtmlKey: "column6Html",
  },

  response: {
    returnHtml: true,
    returnRowCount: true,
    returnPageTitle: true,
    returnPageUrl: true,
  },
};

/**
 * HUGのログイン済みWebViewを使い、指定施設・指定日の
 * attendance.php を直接fetchして利用者テーブルを取得する。
 *
 * DB Flow / Rule / Step は使用しない。
 *
 * @param {Object} options
 * @param {string|number} options.facilityId
 * @param {string} options.dateStr YYYY-MM-DD
 * @param {Electron.WebviewTag|null} options.webview
 *
 * @returns {Promise<{
 *   ok: boolean,
 *   html?: string,
 *   rowCount?: number,
 *   className?: string,
 *   pageTitle?: string,
 *   pageUrl?: string,
 *   automationConfig?: Object,
 *   flowKey?: string,
 *   ruleKey?: string,
 *   error?: string
 * }>}
 */
export async function executeAttendanceFetchFlow({
  facilityId,
  dateStr,
  webview: suppliedWebview = null,
} = {}) {
  if (!facilityId || !dateStr) {
    return {
      ok: false,
      error: "施設IDまたは日付が設定されていません",
    };
  }

  const input = {
    facilityId: String(facilityId),
    dateStr: String(dateStr),
  };

  try {
    const webview =
      suppliedWebview ||
      (await getHugWebviewForCache());

    if (!webview) {
      throw new Error(
        "今日の利用者取得用のHUG WebViewを取得できませんでした"
      );
    }

    const runtimeConfig = {
      ...ATTENDANCE_FETCH_CONFIG,
      request: {
        ...ATTENDANCE_FETCH_CONFIG.request,
        query: {
          ...ATTENDANCE_FETCH_CONFIG.request.query,
          f_id: input.facilityId,
          date: input.dateStr,
        },
      },
    };

    const script = `
      (async () => {
        const CONFIG = ${JSON.stringify(runtimeConfig)};
        const request = CONFIG.request || {};
        const tableConfig = CONFIG.table || {};
        const loginCheck = CONFIG.loginCheck || {};

        const params = new URLSearchParams();

        Object.entries(request.query || {}).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            params.set(key, String(value));
          }
        });

        const queryString = params.toString();

        const targetUrl =
          request.url +
          (queryString
            ? (request.url.includes("?") ? "&" : "?") + queryString
            : "");

        const extractTableFromDocument = (doc) => {
          let table = null;

          if (tableConfig.primarySelector) {
            table = doc.querySelector(tableConfig.primarySelector);
          }

          if (!table && tableConfig.fallbackSelector) {
            table = doc.querySelector(tableConfig.fallbackSelector);
          }

          if (!table) {
            const tables = doc.querySelectorAll("table");
            if (tables.length > 0) {
              table = tables[0];
            }
          }

          if (!table) {
            return null;
          }

          const rows = table.querySelectorAll("tr");

          return {
            html: table.outerHTML,
            rowCount: rows.length,
            className: table.className || "",
          };
        };

        try {
          console.log(
            "[HUG WM][DIRECT] 今日の利用者取得開始:",
            targetUrl
          );

          const response = await fetch(targetUrl, {
            method: request.method || "GET",
            credentials: request.credentials || "include",
            cache: "no-store",
          });

          if (!response.ok) {
            throw new Error(
              "HTTP error: " + response.status
            );
          }

          const pageHtml = await response.text();

          const doc = new DOMParser().parseFromString(
            pageHtml,
            "text/html"
          );

          if (loginCheck.enabled !== false) {
            const selectorMatched =
              loginCheck.loginInputSelector
                ? doc.querySelector(
                    loginCheck.loginInputSelector
                  ) !== null
                : false;

            const titleMatched =
              loginCheck.titleContains
                ? (doc.title || "").includes(
                    loginCheck.titleContains
                  )
                : false;

            const htmlMatched =
              loginCheck.htmlContains
                ? pageHtml.includes(
                    loginCheck.htmlContains
                  )
                : false;

            if (
              selectorMatched ||
              titleMatched ||
              htmlMatched
            ) {
              throw new Error(
                "ログインページが返されました。HUGへのログイン状態を確認してください"
              );
            }
          }

          const tableResult =
            extractTableFromDocument(doc);

          if (!tableResult) {
            throw new Error(
              "利用者テーブルが見つかりません"
            );
          }

          return {
            ok: true,
            html: tableResult.html,
            rowCount: tableResult.rowCount,
            className: tableResult.className,
            pageTitle: doc.title || "",
            pageUrl: response.url || targetUrl,
          };
        } catch (error) {
          console.error(
            "[HUG WM][DIRECT] 利用者テーブル取得エラー:",
            error
          );

          return {
            ok: false,
            error:
              error && error.message
                ? String(error.message)
                : String(error),
          };
        }
      })()
    `;

    const result = await webview.executeJavaScript(script);

    if (!result?.ok) {
      throw new Error(
        result?.error ||
          "利用者データ取得に失敗しました"
      );
    }

    console.log(
      "[Attendance Fetch][DIRECT] 取得完了:",
      {
        facilityId: input.facilityId,
        dateStr: input.dateStr,
        rowCount: result.rowCount,
        pageTitle: result.pageTitle,
        pageUrl: result.pageUrl,
      }
    );

    return {
      ...result,
      flowKey: FLOW_KEY,
      ruleKey: RULE_KEY,
      automationConfig: runtimeConfig,
    };
  } catch (error) {
    console.error(
      "[Attendance Fetch][DIRECT] 取得失敗:",
      error
    );

    return {
      ok: false,
      error:
        error?.message ||
        String(error),
    };
  }
}
