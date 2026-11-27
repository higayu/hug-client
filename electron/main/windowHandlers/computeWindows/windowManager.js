// main/windowHandlers/computeWindows/windowManager.js
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

  const query = {
    window: "additionCompare",
    URL1: url1,
    URL2: url2,
    FACILITY_ID: String(facilityId ?? ""),
    DATE_STR: dateStr ?? "",
  };
  const isDev =
    process.argv.includes("--dev") ||
    process.argv.includes("--debug") ||
    (!app.isPackaged &&
      !process.argv.includes("--prod") &&
      !process.argv.includes("--production"));

  if (isDev) {
    win.loadURL(`http://localhost:5173/?${new URLSearchParams(query)}`);
  } else {
    const rendererPath = path.join(
      app.getAppPath(),
      "renderer",
      "dist",
      "index.html"
    );
    win.loadFile(rendererPath, { query });
  }

  win.webContents.once("did-finish-load", () => {
    void 0;
  });

  return win;
}

/**
 * preload.bundle.cjs のパスを解決する
 * @returns {string} preload.bundle.cjs のパス
 */
function resolvePreloadPath() {
  // 旧パス: preload.js を直接読む方式
  // const devPath = path.join(__dirname, "../../../../preload.js");
  // const prodPath = path.join(process.resourcesPath, "preload.js");

  // 新パス: bundle 済み preload を読む方式
  const bundlePath = path.join(app.getAppPath(), "electron", "preload", "preload.bundle.cjs");

  void 0;
  void 0;

  if (fs.existsSync(bundlePath)) {
    return bundlePath;
  }

  // 旧パス確認用ログだけ残す
  // false && ("[computeWindows/windowManager] old devPath =", devPath);
  // false && ("[computeWindows/windowManager] old prodPath =", prodPath);

  throw new Error("preload.bundle.cjs not found: " + bundlePath);
}

module.exports = {
  createDoubleWebviewWindow,
  resolvePreloadPath,
};
