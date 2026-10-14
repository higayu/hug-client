// main/windowHandlers/windowManager.js
const { BrowserWindow, app } = require("electron");
const path = require("path");
const fs = require("fs");

/**
 * ダブルWebViewウィンドウを作成する
 * @param {string} url1 - 左側のURL
 * @param {string} url2 - 右側のURL
 * @param {string} label - ウィンドウのラベル
 * @param {string} htmlTemplate - HTMLテンプレート
 * @param {string} facilityId - 施設ID
 * @param {string} dateStr - 日付文字列
 * @returns {BrowserWindow} 作成されたウィンドウ
 */
function createDoubleWebviewWindow(
  url1,
  url2,
  label,
  htmlTemplate,
  facilityId,
  dateStr
) {
  const preloadPath = resolvePreloadPath();

  const win = new BrowserWindow({
    width: 1800,
    height: 900,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true,
      sandbox: false,
      webSecurity: false,
    },
  });

  // HTMLテンプレートにURLとpreloadパスを挿入
  const html = htmlTemplate
    .replace("{{URL1}}", url1)
    .replace("{{URL2}}", url2)
    .replace("{{PRELOAD_PATH}}", preloadPath)
    .replace("{{FACILITY_ID}}", facilityId || "")
    .replace("{{DATE_STR}}", dateStr || "");

  win.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(html));

  win.webContents.once("did-finish-load", () => {
    console.log(`${label} window loaded`);
  });

  return win;
}

/**
 * preload.bundle.cjs のパスを解決する
 * @returns {string} preload.bundle.cjs のパス
 */
function resolvePreloadPath() {
 // const devPath = path.join(__dirname, "../../../preload.js");
 // const prodPath = path.join(process.resourcesPath, "preload.js");
  const preloadPath = path.join(app.getAppPath(), "electron", "preload", "preload.bundle.cjs");

  console.log("[windowManager] preloadPath =", preloadPath);
  console.log("[windowManager] preload exists =", fs.existsSync(preloadPath));

  if (fs.existsSync(preloadPath)) {
    return preloadPath;
  }

  throw new Error("preload.bundle.cjs not found: " + preloadPath);
}

module.exports = {
  createDoubleWebviewWindow,
  resolvePreloadPath,
};
