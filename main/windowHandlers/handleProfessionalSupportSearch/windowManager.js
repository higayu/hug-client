// main/windowHandlers/handleProfessionalSupportSearch/windowManager.js
const { BrowserWindow, app } = require("electron");
const path = require("path");
const fs = require("fs");

function createDoubleWebviewWindow(
  url1,
  url2,
  label,
  htmlTemplate, // ← もう使わない（互換のため残してOK）
  targetFacility,
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
    window: "professionalSupport",
    URL1: url1,
    URL2: url2,
    FACILITY_ID: String(targetFacility?.id ?? ""),
    FACILITY_NAME: targetFacility?.name ?? "",
    FACILITY_URL: targetFacility?.url ?? "",
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

  // MainWindow と同じく、明示的なデバッグ起動時だけ DevTools を開く
  const isDebugMode =
    process.argv.includes("--dev") ||
    process.argv.includes("--debug");

  if (isDebugMode) {
    win.webContents.openDevTools();
  }

  win.webContents.once("did-finish-load", () => {
    console.log(`${label} window loaded`);
    console.log("targetFacility:", targetFacility);
  });

  return win;
}

/**
 * preload.bundle.cjs のパス解決
 */
function resolvePreloadPath() {
  // 旧パス: preload.js を直接読む方式
  // const devPath = path.join(__dirname, "../../../../preload.js");
  // const prodPath = path.join(process.resourcesPath, "preload.js");

  // 新パス: bundle 済み preload を読む方式
  const bundlePath = path.join(app.getAppPath(), "preload.bundle.cjs");

  console.log(
    "[handleProfessionalSupportSearch/windowManager] preload bundlePath =",
    bundlePath
  );
  console.log(
    "[handleProfessionalSupportSearch/windowManager] preload bundle exists =",
    fs.existsSync(bundlePath)
  );

  if (fs.existsSync(bundlePath)) {
    return bundlePath;
  }

  // 旧パス確認用ログだけ残す
  // console.log("[handleProfessionalSupportSearch/windowManager] old devPath =", devPath);
  // console.log("[handleProfessionalSupportSearch/windowManager] old prodPath =", prodPath);

  throw new Error("preload.bundle.cjs not found: " + bundlePath);
}

module.exports = {
  createDoubleWebviewWindow,
  resolvePreloadPath,
};
