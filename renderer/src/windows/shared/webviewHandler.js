// renderer/src/windows/shared/webviewHandler.js

/**
 * WebViewで加算登録ラジオボタンをクリックする
 * @param {WebView} webview - 対象のWebView
 * @returns {Promise<boolean>} クリックが成功したかどうか
 */
async function clickAdditionRadio(webview) {
  try {
    
    const success = await webview.executeJavaScript(`
      const radio = document.querySelector('input[type="radio"][name="tableChange"][value="2"]');
      if (radio) {
        radio.click();
        false && ("click addition radio button");
        true;
      } else {
        false && ("addition radio button not found");
        false;
      }
    `);
    
    if (success) {
      void 0;
    } else {
      void 0;
    }
    
    return success;
  } catch (error) {
    console.error("error:", error);
    return false;
  }
}

/**
 * WebViewのページが完全に読み込まれるまで待機する
 * @param {WebView} webview - 対象のWebView
 * @param {number} maxAttempts - 最大試行回数（デフォルト: 30）
 * @param {number} interval - 待機間隔（ミリ秒、デフォルト: 500）
 * @returns {Promise<boolean>} 読み込みが完了したかどうか
 */
async function waitForPageReady(webview, maxAttempts = 30, interval = 500) {
  for (let i = 0; i < maxAttempts; i++) {
    const state = await webview.executeJavaScript('document.readyState');
    if (state === "complete") return true;
    await new Promise(r => setTimeout(r, interval));
  }
  throw new Error("ページロードが完了しませんでした");
}

/**
 * WebViewからテーブルデータを取得する
 * @param {WebView} webview - 対象のWebView
 * @param {string} selector - テーブルセレクター（デフォルト: "table"）
 * @param {string} pageName - ページ名（ログ用）
 * @returns {Promise<string>} テーブルのHTML
 */
async function extractTableData(webview, selector = "table", pageName = "ページ") {
  return await webview.executeJavaScript(`
    false && ("${pageName}:", document.title);
    let el = document.querySelector("${selector}");
    if (!el) {
      false && ("${selector} not found. search table");
      el = document.querySelector("table");
      if (!el) throw new Error("${pageName}にテーブルが見つかりません");
    }
    false && ("table found:", el.className);
    el.outerHTML;
  `);
}

/**
 * 左側のWebViewから加算登録テーブルを取得する
 * @param {WebView} webview - 対象のWebView
 * @returns {Promise<string>} テーブルのHTML
 */
async function extractAdditionTable(webview) {
  return await extractTableData(webview, "table.js_adding_table", "左ページ");
}

/**
 * 右側のWebViewからテーブルを取得する
 * @param {WebView} webview - 対象のWebView
 * @returns {Promise<string>} テーブルのHTML
 */
async function extractRightTable(webview) {
  return await extractTableData(webview, "table", "右ページ");
}

module.exports = {
  clickAdditionRadio,
  waitForPageReady,
  extractTableData,
  extractAdditionTable,
  extractRightTable
};
