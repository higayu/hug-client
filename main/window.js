// main/window.js
const { BrowserWindow, app } = require("electron");
const path = require("path");
const fs = require("fs");

function createMainWindow() {

  // preload.js の絶対パス
  // const preloadPath = path.join(__dirname, "../preload.js");
  // bundle 済み preload のパス
  const preloadPath = path.join(__dirname, "../preload.bundle.cjs");
 // const preloadPath = path.join(app.getAppPath(), "preload.bundle.cjs");

  // renderer の本番ビルド済み HTML
  const rendererDistPath = path.join(
    __dirname,
    "../renderer/dist/index.html"
  );

  // 起動時確認ログ
  console.log("[main/window] __dirname =", __dirname);
  console.log("[main/window] app.getAppPath() =", app.getAppPath());
  console.log("[main/window] app.isPackaged =", app.isPackaged);
  console.log("[main/window] preloadPath =", preloadPath);
  console.log("[main/window] preload exists =", fs.existsSync(preloadPath));
  console.log("[main/window] rendererDistPath =", rendererDistPath);
  console.log(
    "[main/window] renderer dist exists =",
    fs.existsSync(rendererDistPath)
  );

  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, "../assets/favicon.ico"),
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,

      // preload は bundle 済みファイルを読み込む
      sandbox: false,
    },
  });

  // ============================================================
  // 開発環境と本番環境で読み込み方法を切り替え
  // ============================================================

  const hasProdFlag =
    process.argv.includes("--prod") ||
    process.argv.includes("--production");

  const hasDevFlag =
    process.argv.includes("--dev") ||
    process.argv.includes("--debug");

  // 優先順位: --prod > --dev > packaged > dev
  let isDev;

  if (hasProdFlag) {
    isDev = false;
  } else if (hasDevFlag) {
    isDev = true;
  } else if (app.isPackaged) {
    isDev = false;
  } else {
    isDev = true;
  }

  console.log("[main/window] isDev =", isDev);

  if (isDev) {
    // 開発環境: Vite 開発サーバー
    mainWindow.loadURL("http://localhost:5173");
  } else {
    // 本番環境: ビルド済みファイル
    const hasDistFile = fs.existsSync(rendererDistPath);

    if (!hasDistFile) {
      console.error(
        "❌ [MAIN] エラー: renderer/dist/index.html が見つかりません。先に 'npm run build:renderer' を実行してください。"
      );

      // フォールバック: 開発サーバーに接続を試みる
      mainWindow.loadURL("http://localhost:5173");
    } else {
      mainWindow.loadFile(rendererDistPath);
    }
  }

  // ============================================================
  // デバッグモード時のみ Developer Tools を開く
  // ============================================================

  const isDebugMode =
    process.argv.includes("--dev") ||
    process.argv.includes("--debug");

  if (isDebugMode) {
    mainWindow.webContents.openDevTools();
  }

  // Rendererの状態に関係なく、ウィンドウを閉じる際は確認を表示する。
  // main.js 側でも登録されている場合、登録関数内で二重登録を防止する。
  const { registerCloseConfirmation } = require("./closeConfirmation");
  registerCloseConfirmation(mainWindow);

  return mainWindow;
}

module.exports = { createMainWindow };