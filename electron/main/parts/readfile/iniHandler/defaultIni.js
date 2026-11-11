// main/parts/readfile/iniHandler/defaultIni.js
// ini.json のデフォルト設定

const DEFAULT_INI = {
    version: "1.1.0",
    appSettings: {
      autoLogin: {
        enabled: true,
        username: "",
        password: ""
      },
      ui: {
        theme: "light",
        language: "ja",
        showCloseButtons: true,
        confirmOnClose: true,
        autoRefresh: {
          enabled: false,
          interval: 30000
        }
      },
      // 後方互換性のため保持
      features: {},
      window: {
        width: 1200,
        height: 800,
        minWidth: 800,
        minHeight: 600,
        maximized: false,
        alwaysOnTop: false
      },
      notifications: {
        enabled: true,
        sound: true,
        desktop: true
      }
    },
    userPreferences: {
      lastLoginDate: "",
      rememberWindowState: true,
      showWelcomeMessage: true
    },
    apiSettings: {
      baseURL: "http://192.168.1.229",
      laravelURL: "https://dev-hug-banso.we-labo.com",
      facilityId: "3",
      databaseType: "laravel",
      useAI: "chatGPT",
      autoAttendanceFetch: "false",
      autoSynchronization: "true",
      autoSwitching: "false",
      normalModeView: "dashboard",
      professionalSupportSaveMode: "draft",
      memoAutoSaveEnabled: true,
      memoAutoSaveIntervalSeconds: 3,
      debugFlg: "false"
    }
  };
  
  /**
   * 環境に応じたデフォルト設定を取得
   */
  function getDefaultIni(options = {}) {
    const config = JSON.parse(JSON.stringify(DEFAULT_INI));
    
    // 開発環境用の設定
    if (options.dev) {
      config.appSettings.window.width = 1024;
      config.appSettings.window.height = 768;
      config.appSettings.ui.theme = "dark";
      config.apiSettings.debugFlg = "true";
    }
    
    // テスト環境用の設定
    if (options.test) {
      config.apiSettings.baseURL = "http://localhost:3000";
      config.apiSettings.autoSynchronization = "false";
    }
    
    return config;
  }
  
  /**
   * 特定のセクションのみを取得
   */
  function getDefaultIniSection(section) {
    const full = getDefaultIni();
    return full[section] || null;
  }
  
  // 待ち時間は整数の1〜300秒。空欄・不正値は3秒に戻す。
  function normalizeMemoAutoSaveSettings(data) {
    const settings = data.apiSettings;
    settings.memoAutoSaveEnabled = ![false, "false", 0, "0"].includes(settings.memoAutoSaveEnabled);
    const value = settings.memoAutoSaveIntervalSeconds;
    const seconds = typeof value === "number" ||
      (typeof value === "string" && value.trim() !== "")
      ? Number(value) : NaN;
    settings.memoAutoSaveIntervalSeconds = Number.isFinite(seconds)
      ? Math.min(300, Math.max(1, Math.round(seconds))) : 3;
    return data;
  }

  module.exports = {
    normalizeMemoAutoSaveSettings,
    DEFAULT_INI,
    getDefaultIni,
    getDefaultIniSection
  };
