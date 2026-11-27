// src/configUtils/index.js
const fs = require("fs");
const { getDataPath } = require("./fileUtils");

/**
 * デフォルト設定を返す関数
 * @returns {object} デフォルト設定オブジェクト
 */
function getDefaultConfig() {
  return {
    HUG_USERNAME: "",
    HUG_PASSWORD: "",
    GEMINI_API_KEY: "",
    GEMINI_MODEL: "",
    OPEN_ROUTER_API_KEY: "",
    OPEN_ROUTER_MODEL:"",
    DEEPSEEK_MAIL: "",
    DEEPSEEK_PASSWORD: "",
    OPENAI_MAIL: "",
    OPENAI_PASSWORD: "",
    OLLAMA_URL: "",
    OLLAMA_MODEL: ""
  };
}

/**
 * config.json を読み込む関数
 * @returns {object} 設定オブジェクト
 */
function loadConfig() {
  try {
    const configPath = getDataPath("config.json");

    // ファイルが存在しない場合はデフォルト設定を返す
    if (!fs.existsSync(configPath)) {
      void 0;
      return getDefaultConfig();
    }

    const raw = fs.readFileSync(configPath, "utf8");
    const json = JSON.parse(raw);
    void 0;
    return json;
  } catch (err) {
    console.error("error: config.json load failed:", err);
    void 0;
    return getDefaultConfig();
  }
}

module.exports = {
  loadConfig,
  getDefaultConfig,
};
