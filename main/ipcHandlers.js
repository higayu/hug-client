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
const { handleProfessionalSupportSearch } = require("./windowHandlers/handleProfessionalSupportSearch");

const { resolvePreloadPath } = require("./windowHandlers/windowManager");

function registerIpcHandlers(mainWindow, tempNoteHandler) {
  console.log("🔥 registerIpcHandlers CALLED");
  try {
    handleLogin(ipcMain, mainWindow);
    // ★ ここが超重要
    handleApiCalls(ipcMain);
    handleConfigAccess(ipcMain);
    handleIniAccess(ipcMain);
    registerPlanWindows(ipcMain);
    handleProfessionalSupportSearch(ipcMain);

    // =======================================
    // 📋 Clipboard 書き込み IPC ハンドラ
    // =======================================
    ipcMain.handle("clipboard:writeText", async (_event, text) => {
      if (typeof text !== "string") {
        throw new TypeError("clipboard:writeText text must be a string");
      }

      clipboard.writeText(text);
      return true;
    });

    
     // =======================================
    // 🧹 WebView のキャッシュ削除 IPC ハンドラ
    // =======================================
    ipcMain.handle("clear-webview-cache", async (event, wcId) => {
      try {
        const { webContents } = require("electron");
        const wc = webContents.fromId(wcId);

        if (!wc) {
          console.warn("⚠ WebContents が見つかりません:", wcId);
          return false;
        }

        await wc.session.clearCache();

        console.log(`🧹 WebView cache cleared (wcId=${wcId})`);
        return true;
      } catch (err) {
        console.error("❌ clear-webview-cache error:", err);
        return false;
      }
    });

     // =======================================
    //  🔧 アップデートデバッグ情報取得ハンドラー
    // =======================================
    ipcMain.handle('get-update-debug-info', async () => {
      return {
        success: true,
        data: global.updateDebugInfo || {
          isChecking: false,
          lastCheckTime: null,
          checkCount: 0,
          lastError: null,
          currentVersion: "不明",
          updateAvailable: false,
          downloadProgress: 0
        }
      };
    });
    
    // 🔧 手動アップデートチェックハンドラー
    ipcMain.handle('check-for-updates', async () => {
    
      try {
        const { autoUpdater } = require("electron-updater");
        const result = await autoUpdater.checkForUpdates();
        
        return { success: true, data: result };
      } catch (err) {
    
        return { success: false, error: err.message };
      }
    });
    
    
    // 🔧 webviewのpreload属性用のパス取得ハンドラー
    ipcMain.handle('get-preload-path', async () => {
      try {
        // windowManager.jsと同じロジックを使用
        const preloadPath = resolvePreloadPath();
        
        // ファイル存在確認
        if (!fs.existsSync(preloadPath)) {
          console.error('❌ preload.jsが見つかりません:', preloadPath);
          console.error('🔍 [getPreloadPath] app.isPackaged:', app.isPackaged);
          return null;
        }
        
        // pathToFileURLは絶対パスをfile:// URLに変換する
        const fileUrl = pathToFileURL(preloadPath).href;

        return fileUrl;
      } catch (err) {
        console.error("❌ [IPC] preloadパス取得エラー:", err);
        throw err;
      }
    });
    
    // 出勤データ列データ保存ハンドラー
    ipcMain.handle('saveAttendanceColumnData', async (event, data) => {
      try {
        
        // データディレクトリのパスを取得
        const { getDataPath } = require("./parts/utils/util");
        const dataDir = getDataPath("attendance");
        const fileName = `attendance_${data.facilityId}_${data.dateStr}_${data.childId}.json`;
        const filePath = path.join(dataDir, fileName);
        
        // ディレクトリが存在しない場合は作成
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        
        // 保存データを構築
        const saveData = {
          facilityId: data.facilityId,
          dateStr: data.dateStr,
          childId: data.childId,
          childName: data.childName,
          extractedAt: new Date().toISOString(),
          extractedData: data.extractedData
        };
        
        // JSONファイルとして保存
        const jsonString = JSON.stringify(saveData, null, 2);
        fs.writeFileSync(filePath, jsonString, "utf8");
        
        
        return { success: true, filePath: filePath };
      } catch (err) {
        console.error("❌ [IPC] 出勤データ列データ保存失敗:", err);
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle("open-devtools", () => {
      const win = BrowserWindow.getFocusedWindow();
      if (win) {
        win.webContents.openDevTools({ mode: "detach" }); // 任意
      }
    });

    // アプリ内ツールメニューから呼び出すウィンドウ操作
    ipcMain.handle("window:minimize", (event) => {
      BrowserWindow.fromWebContents(event.sender)?.minimize();
    });

    ipcMain.handle("window:toggle-maximize", (event) => {
      const win = BrowserWindow.fromWebContents(event.sender);
      if (!win) return;

      win.isMaximized() ? win.unmaximize() : win.maximize();
    });

    ipcMain.handle("window:reload", (event) => {
      BrowserWindow.fromWebContents(event.sender)?.reload();
    });

    ipcMain.handle("app:quit", () => {
      app.quit();
    });

    
  } catch (error) {
    console.error("error:", error);
  }
  console.log("🔥 registerIpcHandlers END");
  
}

module.exports = { registerIpcHandlers };
