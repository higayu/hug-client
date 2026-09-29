// main/parts/readfile/configHandler/index.js
const fs = require("fs");
const path = require("path");
const { app, dialog, shell } = require("electron");
const { getDataDir, getConfigPath } = require("../../utils/pathResolver");
const { DEFAULT_CONFIG, getDefaultConfig } = require("./defaultConfig");

function removeHandlerIfRegistered(ipcMain, channel) {
  try {
    ipcMain.removeHandler(channel);
  } catch (error) {
    console.warn(
      `⚠️ IPCハンドラーを解除できませんでした: ${channel}`,
      error?.message ?? error,
    );
  }
}

function handleConfigAccess(ipcMain) {
  removeHandlerIfRegistered(ipcMain, "read-config");
  removeHandlerIfRegistered(ipcMain, "save-config");
  removeHandlerIfRegistered(ipcMain, "import-config-file");
  removeHandlerIfRegistered(ipcMain, "open-config-folder");

  // ============================================================
  // 📖 config.json 読み込み
  // ============================================================
  ipcMain.handle("read-config", async () => {
    try {
      const filePath = getConfigPath();

      if (!fs.existsSync(filePath)) {
        // デフォルト設定を使用
        const defaultConfig = getDefaultConfig();
        
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

        fs.writeFileSync(filePath, JSON.stringify(defaultConfig, null, 2));
        return { success: true, data: defaultConfig };
      }

      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      
      // バージョンチェックやマイグレーションが必要な場合
      // 不足しているキーをデフォルト値で補完
      const completeData = { ...DEFAULT_CONFIG, ...jsonData };
      
      // 補完したデータを保存（必要に応じて）
      if (Object.keys(completeData).length !== Object.keys(jsonData).length) {
        fs.writeFileSync(filePath, JSON.stringify(completeData, null, 2), "utf8");
      }
      
      return { success: true, data: completeData };
    } catch (err) {
      console.error("❌ config読み込み失敗:", err);
      return { success: false, error: err.message };
    }
  });

  // ============================================================
  // 💾 config.json 保存
  // ============================================================
  ipcMain.handle("save-config", async (event, data) => {
    try {
      if (!data || typeof data !== "object") {
        console.error("❌ config.json保存失敗: データが無効です", data);
        return { success: false, error: "データが無効です。" };
      }

      // 必須フィールドが存在するかチェック
      const requiredFields = ['GEMINI_API_KEY', 'OLLAMA_URL', 'HUG_USERNAME'];
      const missingFields = requiredFields.filter(field => !(field in data));
      if (missingFields.length > 0) {
        console.warn(`⚠️ 必須フィールドが不足しています: ${missingFields.join(', ')}`);
        // 不足フィールドをデフォルト値で補完
        missingFields.forEach(field => {
          if (field in DEFAULT_CONFIG) {
            data[field] = DEFAULT_CONFIG[field];
          }
        });
      }

      const filePath = getConfigPath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

      return { success: true };
    } catch (err) {
      console.error("❌ config.json保存失敗:", err);
      return { success: false, error: err.message };
    }
  });

  // ============================================================
  // 📂 設定ファイルインポート
  // ============================================================
  ipcMain.handle("import-config-file", async () => {
    try {
      const { canceled, filePaths } = await dialog.showOpenDialog({
        title: "設定ファイルを選択してください (config.json または ini.json)",
        filters: [{ name: "JSONファイル", extensions: ["json"] }],
        properties: ["openFile"],
      });

      if (canceled || filePaths.length === 0) return { success: false };

      const selectedFile = filePaths[0];
      const fileName = path.basename(selectedFile);
      const destDir = getDataDir();
      const destPath = path.join(destDir, fileName);

      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(selectedFile, destPath);

      return { success: true, destination: destPath, fileName };
    } catch (err) {
      return { success: false, message: err.message };
    }
  });

  // ============================================================
  // 📁 設定フォルダを開く
  // ============================================================
  ipcMain.handle("open-config-folder", async () => {
    try {
      const configDir = getDataDir();
      if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true });
      await shell.openPath(configDir);
      return { success: true, path: configDir };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
}

module.exports = { handleConfigAccess };
