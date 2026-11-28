// 旧実装: getActiveWebview + attendance.php へ webview.src 遷移して DOM からテーブル取得
// 参照用に残置。本番は fetchAttendanceTableData.js（Cache / fetch）を使用。

import { getActiveWebview } from "../webview/webviewState.js";

async function waitForPageReady(webview, maxAttempts = 30, interval = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const state = await webview.executeJavaScript("document.readyState");
      if (state === "complete") {
        await new Promise((r) => setTimeout(r, 500));
        return true;
      }
    } catch (error) {
      console.warn(
        `⚠️ [ATTENDANCE] ページ読み込み確認エラー (${i + 1}/${maxAttempts}):`,
        error
      );
    }
    await new Promise((r) => setTimeout(r, interval));
  }
  throw new Error("ページロードが完了しませんでした");
}

/** @deprecated アクティブ webview + 画面遷移が必要な旧 fetch */
export async function fetchAttendanceTableDataLegacy(
  facility_id,
  date_str,
  options = {},
  webviewParam = null
) {
  const { selector = "table", useMainWebview = true, showToast = true } = options;

  let webview;

  try {
    if (webviewParam) {
      webview = webviewParam;
      void 0;
    } else if (useMainWebview) {
      webview = getActiveWebview();
      if (!webview) throw new Error("メインwebviewが見つかりません");
    } else {
      throw new Error("対象webviewが指定されていません");
    }

    const targetUrl = `https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail&f_id=${facility_id}&date=${date_str}`;

    void 0;
    if (showToast && window.showInfoToast) {
      window.showInfoToast("📥 データ取得中...", 2000);
    }

    const currentSrc = webview.getURL?.() || "";
    if (!currentSrc.includes(targetUrl)) {
      webview.src = targetUrl;
    } else {
      void 0;
    }

    await waitForPageReady(webview);

    const isLoginPage = await webview.executeJavaScript(`
      document.querySelector('input[name="username"]') !== null ||
      document.title.includes('ログイン') ||
      document.URL.includes('login')
    `);

    if (isLoginPage) {
      throw new Error(
        "ログインページが表示されました。自動ログインを実行してください。"
      );
    }

    const currentUrl = webview.getURL();
    if (!currentUrl || currentUrl === "about:blank") {
      throw new Error("webviewがまだ読み込まれていません");
    }

    const selectorStr = JSON.stringify(selector);
    const tableHTML = await webview.executeJavaScript(`
      (function() {
        try {
          var selector = ${selectorStr};
          var table = document.querySelector(selector) || document.querySelector("table");
          if (!table) {
            var tables = document.querySelectorAll("table");
            if (tables.length > 0) table = tables[0];
          }
          if (!table) {
            return { success: false, error: "テーブルが見つかりません", html: null };
          }
          var rows = table.querySelectorAll("tr");
          return {
            success: true,
            html: table.outerHTML,
            className: table.className || "",
            rowCount: rows.length,
            pageTitle: document.title || "",
            pageUrl: window.location.href || ""
          };
        } catch (error) {
          return {
            success: false,
            error: "JavaScript実行エラー: " + (error.message || String(error)),
            html: null
          };
        }
      })();
    `);

    if (!tableHTML?.success) {
      throw new Error(tableHTML?.error || "テーブルデータの取得に失敗しました");
    }

    if (showToast && window.showSuccessToast) {
      window.showSuccessToast(`✅ データ取得完了\n行数: ${tableHTML.rowCount}`, 3000);
    }

    return {
      success: true,
      html: tableHTML.html,
      className: tableHTML.className,
      rowCount: tableHTML.rowCount,
      pageTitle: tableHTML.pageTitle,
      pageUrl: tableHTML.pageUrl,
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
