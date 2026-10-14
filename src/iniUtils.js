// src/iniUtils/index.js
const fs = require("fs");
const path = require("path");
const { app } = require("electron");

/**
 * ini.jsonのパスを解決
 */
function resolveIniPath() {
  if (app.isPackaged) {
    return path.join(app.getPath("userData"), "data", "ini.json");
  } else {
    // dev path is electron/data/ini.json
    return path.join(__dirname, "..", "electron", "data", "ini.json");
  }
}

/**
 * デフォルト設定を返す関数
 * @returns {object} デフォルト設定オブジェクト
 */
function getDefaultIni() {
  // ini.json.example を優先して読み込む
  try {
    const examplePath = path.join(__dirname, "..", "electron", "data", "ini.json.example");
    if (fs.existsSync(examplePath)) {
      return JSON.parse(fs.readFileSync(examplePath, "utf8"));
    }
  } catch (e) {
    console.error("ini.json.example load failed, fallback defaults used", e);
  }

  return {
    version: "1.0.0",
    appSettings: {
      autoLogin: { enabled: true },
      ui: {
        theme: "light",
        language: "ja",
        showCloseButtons: true,
        confirmOnClose: true,
        autoRefresh: { enabled: false, interval: 30000 },
      },
      features: {
        getUrl: { enabled: false, buttonText: "URL取得", buttonColor: "#762e8c" },
      },
      window: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        maximized: false,
        alwaysOnTop: false,
      },
      notifications: { enabled: true, sound: true, desktop: true },
    },
    userPreferences: {
      lastLoginDate: "",
      rememberWindowState: true,
      showWelcomeMessage: true,
    },
    apiSettings: {
      baseURL: "http://192.168.1.229",
      laravelURL: "https://dev-hug-banso.we-labo.com",
      staffId: "",
      facilityId: "3",
      databaseType: "mariadb",
      useAI: "chatGPT",
    },
  };
}

/**
 * ini.json を読み込む関数
 * @returns {object} 設定オブジェクト
 */
function loadIni() {
  try {
    const iniPath = resolveIniPath();
    console.log("ini.json path:", iniPath);
    
    if (!fs.existsSync(iniPath)) {
      console.log("ini.json not found. writing defaults.");
      const def = getDefaultIni();
      const dir = path.dirname(iniPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(iniPath, JSON.stringify(def, null, 2));
      return def;
    }
    
    const raw = fs.readFileSync(iniPath, "utf8");
    const json = JSON.parse(raw);
    console.log("ini.json loaded:", {
      baseURL: json?.apiSettings?.baseURL,
      laravelURL: json?.apiSettings?.laravelURL,
      databaseType: json?.apiSettings?.databaseType,
      useAI: json?.apiSettings?.useAI
    });
    return json;
  } catch (err) {
    console.error("error: ini.json load failed:", err);
    console.log("default settings used.");
    const def = getDefaultIni();
    try {
      const iniPath = resolveIniPath();
      const dir = path.dirname(iniPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(iniPath, JSON.stringify(def, null, 2));
    } catch (_) {}
    return def;
  }
}

module.exports = {
  loadIni,
  getDefaultIni,
};
