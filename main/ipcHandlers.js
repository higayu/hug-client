// main/ipcHandlers.js
console.log("🔥 ipcHandlers.js LOADED");

const { ipcMain, app, BrowserWindow, clipboard } = require("electron");
const path = require("path");
const { pathToFileURL } = require("url");
const fs = require("fs");

const { handleLogin } = require("./parts/loginHandler");
const { handleApiCalls } = require("./parts/handlers");
const { handleConfigAccess } = require("./parts/readfile/configHandler");
const { handleIniAccess } = require("./parts/readfile/iniHandler");
const { registerPlanWindows } = require("./windowHandlers/planWindows");
const {
  handleProfessionalSupportSearch,
} = require("./windowHandlers/handleProfessionalSupportSearch");
const {
  registerInformationWindow,
} = require("./windowHandlers/informationWindow");
const {
  registerPhpMyAdminWindow,
} = require("./windowHandlers/phpMyAdminWindow");
const { resolvePreloadPath } = require("./windowHandlers/windowManager");

/**
 * IPC登録処理を個別に安全実行する。
 *
 * 1つの登録処理でエラーが発生しても、
 * 他のIPCハンドラー登録を継続する。
 */
function safeRegister(name, callback) {
  try {
    callback();

    console.log(`✅ [IPC] ${name} registered`);
    return true;
  } catch (error) {
    console.error(`❌ [IPC] ${name} registration failed:`, error);
    return false;
  }
}

/**
 * ipcMain.handle() の重複登録を防ぎながら登録する。
 */
function registerHandle(channel, handler) {
  try {
    ipcMain.removeHandler(channel);
  } catch (error) {
    console.warn(
      `⚠️ [IPC] removeHandler failed: ${channel}`,
      error?.message ?? error,
    );
  }

  ipcMain.handle(channel, handler);
  console.log(`✅ [IPC] handle registered: ${channel}`);
}

function registerIpcHandlers(mainWindow, tempNoteHandler) {
  console.log("🔥 registerIpcHandlers START");

  // ============================================================
  // HUGログイン
  // ============================================================
  safeRegister("login", () => {
    handleLogin(ipcMain, mainWindow);
  });

  // ============================================================
  // DB / Laravel API
  // ============================================================
  safeRegister("database / api", () => {
    handleApiCalls(ipcMain);
  });

  // ============================================================
  // config.json
  // ============================================================
  safeRegister("config", () => {
    handleConfigAccess(ipcMain);
  });

  // ============================================================
  // ini.json
  // ============================================================
  safeRegister("ini", () => {
    handleIniAccess(ipcMain);
  });

  // ============================================================
  // 各種ウィンドウ
  // ============================================================
  safeRegister("plan windows", () => {
    registerPlanWindows(ipcMain);
  });

  safeRegister("professional support search", () => {
    handleProfessionalSupportSearch(ipcMain);
  });

  safeRegister("information window", () => {
    registerInformationWindow(ipcMain);
  });

  safeRegister("phpMyAdmin window", () => {
    registerPhpMyAdminWindow(ipcMain);
  });

  // ============================================================
  // Clipboard
  // ============================================================
  safeRegister("clipboard:writeText", () => {
    registerHandle("clipboard:writeText", async (_event, text) => {
      if (typeof text !== "string") {
        throw new TypeError("clipboard:writeText text must be a string");
      }

      clipboard.writeText(text);
      return true;
    });
  });

  // ============================================================
  // WebView cache
  // ============================================================
  safeRegister("clear-webview-cache", () => {
    registerHandle("clear-webview-cache", async (_event, wcId) => {
      try {
        const { webContents } = require("electron");
        const wc = webContents.fromId(wcId);

        if (!wc) {
          console.warn("⚠️ WebContents が見つかりません:", wcId);
          return false;
        }

        await wc.session.clearCache();
        console.log(`🧹 WebView cache cleared (wcId=${wcId})`);
        return true;
      } catch (error) {
        console.error("❌ clear-webview-cache error:", error);
        return false;
      }
    });
  });

  // ============================================================
  // Update debug information
  // ============================================================
  safeRegister("get-update-debug-info", () => {
    registerHandle("get-update-debug-info", async () => {
      return {
        success: true,
        data: global.updateDebugInfo || {
          isChecking: false,
          lastCheckTime: null,
          checkCount: 0,
          lastError: null,
          currentVersion: "不明",
          updateAvailable: false,
          downloadProgress: 0,
        },
      };
    });
  });

  // ============================================================
  // Manual update check
  // ============================================================
  safeRegister("check-for-updates", () => {
    registerHandle("check-for-updates", async () => {
      try {
        const { autoUpdater } = require("electron-updater");
        const result = await autoUpdater.checkForUpdates();

        return {
          success: true,
          data: result,
        };
      } catch (error) {
        console.error("❌ [check-for-updates]", error);

        return {
          success: false,
          error: error?.message ?? String(error),
        };
      }
    });
  });

  // ============================================================
  // WebView preload path
  // ============================================================
  safeRegister("get-preload-path", () => {
    registerHandle("get-preload-path", async () => {
      try {
        const preloadPath = resolvePreloadPath();

        console.log("🔍 [get-preload-path] resolved:", preloadPath);
        console.log("🔍 [get-preload-path] app.isPackaged:", app.isPackaged);

        if (!preloadPath || !fs.existsSync(preloadPath)) {
          console.error("❌ preload.jsが見つかりません:", preloadPath);
          return null;
        }

        const fileUrl = pathToFileURL(preloadPath).href;
        console.log("✅ [get-preload-path]", fileUrl);
        return fileUrl;
      } catch (error) {
        console.error("❌ [IPC] preloadパス取得エラー:", error);
        throw error;
      }
    });
  });

  // ============================================================
  // 出勤データ列保存
  // ============================================================
  safeRegister("saveAttendanceColumnData", () => {
    registerHandle("saveAttendanceColumnData", async (_event, data) => {
      try {
        const { getDataPath } = require("./parts/utils/util");
        const dataDir = getDataPath("attendance");
        const fileName = `attendance_${data.facilityId}_${data.dateStr}_${data.childId}.json`;
        const filePath = path.join(dataDir, fileName);

        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }

        const saveData = {
          facilityId: data.facilityId,
          dateStr: data.dateStr,
          childId: data.childId,
          childName: data.childName,
          extractedAt: new Date().toISOString(),
          extractedData: data.extractedData,
        };

        fs.writeFileSync(
          filePath,
          JSON.stringify(saveData, null, 2),
          "utf8",
        );

        return {
          success: true,
          filePath,
        };
      } catch (error) {
        console.error("❌ [IPC] 出勤データ列データ保存失敗:", error);

        return {
          success: false,
          error: error?.message ?? String(error),
        };
      }
    });
  });

  // ============================================================
  // DevTools
  // ============================================================
  safeRegister("open-devtools", () => {
    registerHandle("open-devtools", async () => {
      const win = BrowserWindow.getFocusedWindow();

      if (win) {
        win.webContents.openDevTools({ mode: "detach" });
      }

      return true;
    });
  });

  // ============================================================
  // Window control
  // ============================================================
  safeRegister("window:minimize", () => {
    registerHandle("window:minimize", async (event) => {
      BrowserWindow.fromWebContents(event.sender)?.minimize();
      return true;
    });
  });

  safeRegister("window:toggle-maximize", () => {
    registerHandle("window:toggle-maximize", async (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);

      if (!win) {
        return false;
      }

      if (win.isMaximized()) {
        win.unmaximize();
      } else {
        win.maximize();
      }

      return true;
    });
  });

  safeRegister("window:reload", () => {
    registerHandle("window:reload", async (event) => {
      BrowserWindow.fromWebContents(event.sender)?.reload();
      return true;
    });
  });

  safeRegister("app:quit", () => {
    registerHandle("app:quit", async () => {
      app.quit();
      return true;
    });
  });

  // 既存シグネチャとの互換性維持
  void tempNoteHandler;

  console.log("✅ registerIpcHandlers END");
}

module.exports = {
  registerIpcHandlers,
};
