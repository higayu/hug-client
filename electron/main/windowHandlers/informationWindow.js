const { BrowserWindow, app } = require("electron");
const path = require("path");
const fs = require("fs");
const { resolvePreloadPath } = require("./windowManager");

let informationWindow = null;
let applicationWindow = null;

function isDevelopmentMode() {
  const hasProdFlag =
    process.argv.includes("--prod") ||
    process.argv.includes("--production");

  const hasDevFlag =
    process.argv.includes("--dev") ||
    process.argv.includes("--debug");

  if (hasProdFlag) return false;
  if (hasDevFlag) return true;
  if (app.isPackaged) return false;
  return true;
}

async function openInformationWindow() {
  if (informationWindow && !informationWindow.isDestroyed()) {
    if (informationWindow.isMinimized()) informationWindow.restore();
    informationWindow.show();
    informationWindow.focus();
    return true;
  }

  informationWindow = new BrowserWindow({
    width: 1100,
    height: 820,
    minWidth: 760,
    minHeight: 560,
    title: "Q&A・障害対応",
    icon: path.join(app.getAppPath(), "assets", "favicon.ico"),
    webPreferences: {
      preload: resolvePreloadPath(),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
    },
  });

  informationWindow.on("closed", () => {
    informationWindow = null;
  });

  if (isDevelopmentMode()) {
    await informationWindow.loadURL(
      "http://localhost:5173/?window=information",
    );
  } else {
    const rendererPath = path.join(
      app.getAppPath(),
      "renderer",
      "dist",
      "index.html",
    );

    if (!fs.existsSync(rendererPath)) {
      throw new Error(
        `renderer/dist/index.html が見つかりません: ${rendererPath}`,
      );
    }

    await informationWindow.loadFile(rendererPath, {
      query: { window: "information" },
    });
  }

  return true;
}

function registerInformationWindow(ipcMain, mainWindow = null) {
  applicationWindow = mainWindow;
  try {
    ipcMain.removeHandler("open-information-window");
  } catch (_) {}

  ipcMain.handle("open-information-window", async () => {
    try {
      await openInformationWindow();
      return { success: true };
    } catch (error) {
      console.error("[InformationWindow] 起動エラー:", error);
      return {
        success: false,
        error: error?.message || String(error),
      };
    }
  });

  for (const channel of ["inquiry:get-app-version", "inquiry:capture-screen"]) {
    try { ipcMain.removeHandler(channel); } catch (_) {}
  }

  ipcMain.handle("inquiry:get-app-version", () => app.getVersion());

  ipcMain.handle("inquiry:capture-screen", async (event) => {
    const dialogWindow = BrowserWindow.fromWebContents(event.sender);
    if (!dialogWindow || dialogWindow !== informationWindow) {
      return { success: false, message: "この画面からは撮影できません。" };
    }
    const targetWindow = applicationWindow && !applicationWindow.isDestroyed()
      ? applicationWindow
      : BrowserWindow.getAllWindows().find((win) => win !== dialogWindow && !win.isDestroyed());

    if (!targetWindow) {
      return { success: false, message: "撮影するアプリ画面が見つかりません。" };
    }

    try {
      dialogWindow.hide();
      const image = await targetWindow.webContents.capturePage();
      return {
        success: true,
        name: `hug-client-${Date.now()}.png`,
        type: "image/png",
        bytes: image.toPNG(),
      };
    } catch (error) {
      return { success: false, message: error?.message || "アプリ画面の撮影に失敗しました。" };
    } finally {
      if (!dialogWindow.isDestroyed()) {
        dialogWindow.show();
        dialogWindow.focus();
      }
    }
  });
}

module.exports = {
  registerInformationWindow,
  openInformationWindow,
};
