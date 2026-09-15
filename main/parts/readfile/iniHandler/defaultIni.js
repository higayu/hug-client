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
      databaseType: "mariadb",
      useAI: "chatGPT",
      autoAttendanceFetch: "false",
      autoSynchronization: "true",
      autoSwitching: "true",
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
  
  module.exports = {
    DEFAULT_INI,
    getDefaultIni,
    getDefaultIniSection
  };
