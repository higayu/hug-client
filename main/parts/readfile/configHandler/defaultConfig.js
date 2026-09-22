// main/parts/readfile/configHandler/defaultConfig.js
// config.json のデフォルト設定

const DEFAULT_CONFIG = {
    // AI関連設定
    GEMINI_API_KEY: "",
    GEMINI_MODEL: "gemini-3.5-flash",
    OPEN_ROUTER_API_KEY: "",
    OPEN_ROUTER_MODEL: "openai/gpt-oss-120b:free",
    DEEPSEEK_MAIL: "",
    DEEPSEEK_PASSWORD: "",
    OPENAI_MAIL: "",
    OPENAI_PASSWORD: "",
    OLLAMA_URL: "http://localhost:11434/api/generate",
    OLLAMA_MODEL: "gemma4:latest",
    
    // 認証情報
    HUG_USERNAME: "",
    HUG_PASSWORD: "",
    PHP_MY_ADMIN: "https",
    PHP_MY_ADMIN_USER: "",
    PHP_MY_ADMIN_PASSWORD: "",
    
    // その他
    USE_AI: "ollama", // 'ollama' | 'gemini' | 'openrouter' | 'deepseek' | 'openai'
    DEBUG_MODE: false,
    LOG_LEVEL: "info", // 'debug' | 'info' | 'warn' | 'error'
    
    // APIタイムアウト設定
    API_TIMEOUT: 120000, // 120秒（2分）
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000, // 1秒
  };
  
  /**
   * 環境変数からデフォルト設定を上書きする場合
   */
  function getDefaultConfigWithEnv() {
    const config = { ...DEFAULT_CONFIG };
    
    // 環境変数があれば上書き
    if (process.env.GEMINI_API_KEY) {
      config.GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    }
    if (process.env.OPEN_ROUTER_API_KEY) {
      config.OPEN_ROUTER_API_KEY = process.env.OPEN_ROUTER_API_KEY;
    }
    if (process.env.OLLAMA_URL) {
      config.OLLAMA_URL = process.env.OLLAMA_URL;
    }
    
    return config;
  }
  
  /**
   * デフォルト設定を取得（必要に応じてカスタマイズ可能）
   */
  function getDefaultConfig(options = {}) {
    const baseConfig = options.useEnv ? getDefaultConfigWithEnv() : { ...DEFAULT_CONFIG };
    
    // オプションで特定の設定を上書き
    if (options.aiProvider) {
      baseConfig.USE_AI = options.aiProvider;
    }
    if (options.debug) {
      baseConfig.DEBUG_MODE = true;
    }
    
    return baseConfig;
  }
  
  module.exports = {
    DEFAULT_CONFIG,
    getDefaultConfig,
    getDefaultConfigWithEnv,
  };
