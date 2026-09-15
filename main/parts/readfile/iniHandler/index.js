// main/parts/readfile/iniHandler/index.js
const fs = require("fs");
const path = require("path");
const { getIniPath } = require("../../utils/pathResolver");
const { DEFAULT_INI, getDefaultIni } = require("./defaultIni");

function handleIniAccess(ipcMain) {
  // ============================================================
  // 📖 ini.json 読み込み
  // ============================================================
  ipcMain.handle("read-ini", async () => {
    try {
      const filePath = getIniPath();

      // ini.json が存在しない場合は自動生成
      if (!fs.existsSync(filePath)) {
        const defaultIni = getDefaultIni();
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(defaultIni, null, 2));
        return { success: true, data: defaultIni };
      }

      const jsonData = JSON.parse(fs.readFileSync(filePath, "utf8"));
      const hadLegacyStaffId = Object.prototype.hasOwnProperty.call(
        jsonData.apiSettings ?? {},
        "staffId"
      );
      if (jsonData.apiSettings) delete jsonData.apiSettings.staffId;

      // バージョンにかかわらず不足キーを補完し、未知の既存キーは保持する
      const normalizedData = mergeDeep(DEFAULT_INI, jsonData);
      normalizedData.version = DEFAULT_INI.version;

      if (!jsonData.version || jsonData.version !== DEFAULT_INI.version) {
        console.warn(`⚠️ ini.json のバージョンが異なります (current: ${DEFAULT_INI.version}, file: ${jsonData.version || 'undefined'})`);
      }

      if (
        hadLegacyStaffId ||
        JSON.stringify(normalizedData) !== JSON.stringify(jsonData)
      ) {
        fs.writeFileSync(filePath, JSON.stringify(normalizedData, null, 2), "utf8");
      }
      return { success: true, data: normalizedData };
    } catch (err) {
      console.error("❌ ini.json 読み込み失敗:", err);
      // 破損時はデフォルトを返す
      try {
        const fallback = getDefaultIni();
        fs.writeFileSync(getIniPath(), JSON.stringify(fallback, null, 2));
        return { success: true, data: fallback };
      } catch (e) {
        return { success: false, error: err.message };
      }
    }
  });

  // ============================================================
  // 💾 ini.json 保存
  // ============================================================
  ipcMain.handle("save-ini", async (event, data) => {
    try {
      const filePath = getIniPath();

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      // 部分的な設定オブジェクトでも既存の設定を失わないようにマージする
      let currentData = {};
      if (fs.existsSync(filePath)) {
        currentData = JSON.parse(fs.readFileSync(filePath, "utf8"));
        if (currentData.apiSettings) delete currentData.apiSettings.staffId;
      }
      const saveData = mergeDeep(
        mergeDeep(DEFAULT_INI, currentData),
        data || {}
      );
      saveData.version = data?.version || DEFAULT_INI.version;

      const jsonString = JSON.stringify(saveData, null, 2);
      fs.writeFileSync(filePath, jsonString, "utf8");

      return { success: true };
    } catch (err) {
      console.error("❌ ini.json 保存エラー:", err);
      return { success: false, error: err.message };
    }
  });

  // ============================================================
  // 🔄 ini.json リセット（デフォルトで上書き）
  // ============================================================
  ipcMain.handle("reset-ini", async () => {
    try {
      const filePath = getIniPath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      const defaultIni = getDefaultIni();
      fs.writeFileSync(filePath, JSON.stringify(defaultIni, null, 2), "utf8");
      return { success: true, data: defaultIni };
    } catch (err) {
      console.error("❌ ini.json リセットエラー:", err);
      return { success: false, error: err.message };
    }
  });

  // ============================================================
  // ✏️ ini.json の特定設定項目を更新
  // ============================================================
  ipcMain.handle("update-ini-setting", async (event, settingPath, value) => {
    try {
      const filePath = getIniPath();

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

      let data = {};

      // JSON 破損対策
      if (fs.existsSync(filePath)) {
        try {
          data = JSON.parse(fs.readFileSync(filePath, "utf8"));
        } catch (e) {
          console.error("⚠️ ini.json が破損していたため初期化します");
          data = getDefaultIni();
        }
      } else {
        data = getDefaultIni();
      }

      // 深いパスの作成
      const keys = settingPath.split(".");
      let obj = data;
      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];

        // オブジェクト以外なら強制的にオブジェクトに変換
        if (typeof obj[key] !== "object" || obj[key] === null) {
          obj[key] = {};
        }

        obj = obj[key];
      }

      obj[keys[keys.length - 1]] = value;

      // 原子的書き込み
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");

      return { success: true, data };

    } catch (err) {
      console.error("❌ ini.json 更新エラー:", err);
      return { success: false, error: err.message };
    }
  });
}

/**
 * オブジェクトのディープマージ
 */
function mergeDeep(target, source) {
  const result = { ...target };
  
  for (const key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = mergeDeep(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  
  return result;
}

module.exports = { handleIniAccess };
