// renderer/src/AppStateContext/useAppInitializer/index.js

import {
  loadConfig,
  loadIni,
} from "@/utils/config";

import {
  updateAppState,
} from "@/store/slices/appStateSlice";

/**
 * boolean / string boolean を吸収する
 *
 * ini.json では
 * "true" / "false"
 * true / false
 * の両方が来る可能性があるため、ここで統一する
 */
const toBooleanFlag = (value, defaultValue = true) => {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return defaultValue;
};

/**
 * DATABASE_TYPE の表記を正規化する
 */
const normalizeDatabaseType = (value) => {
  return "laravel";
};

/**
 * AppState 初期化
 *
 * 方針:
 * - config.json / ini.json を読み込む
 * - すべて読み込み完了後に Redux(appStateSlice) へ反映する
 * - activeApi は使わない
 * - DATABASE_TYPE を正本にする
 * - AUTO_SYNCHRONIZATION / AUTO_SWITCHING も ini.json から Redux に反映する
 * - Redux反映後、最後に setIsInitialized(true) を呼ぶ
 *
 * @param {Object} params
 * @param {Function} params.dispatch Redux dispatch
 * @param {Function} params.setIsInitialized 初期化完了フラグ setter
 * @returns {Promise<{ config: Object | null, ini: Object | null }>}
 */
export async function initializeAppState({
  dispatch,
  setIsInitialized,
}) {
  const merged = {};

  try {
    console.group("🚀 [initializeAppState] 初期化開始");

    // =============================================================
    // 1) config / ini を読み込む
    // =============================================================
    const [config, ini] = await Promise.all([
      loadConfig(),
      loadIni(),
    ]);

    // =============================================================
    // 2) config.json → Redux 反映用 merged
    // 存在するものだけ反映する
    // =============================================================

    // HUG 認証情報
    if (config?.HUG_USERNAME !== undefined) {
      merged.HUG_USERNAME = config.HUG_USERNAME;
    }

    if (config?.HUG_PASSWORD !== undefined) {
      merged.HUG_PASSWORD = config.HUG_PASSWORD;
    }

    // Gemini
    if (config?.GEMINI_API_KEY !== undefined) {
      merged.GEMINI_API_KEY = config.GEMINI_API_KEY;
    }

    if (config?.GEMINI_MODEL !== undefined) {
      merged.GEMINI_MODEL = config.GEMINI_MODEL;
    }

    // OpenRouter
    if (config?.OPEN_ROUTER_API_KEY !== undefined) {
      merged.OPEN_ROUTER_API_KEY = config.OPEN_ROUTER_API_KEY;
    }

    if (config?.OPEN_ROUTER_MODEL !== undefined) {
      merged.OPEN_ROUTER_MODEL = config.OPEN_ROUTER_MODEL;
    }

    // DeepSeek
    if (config?.DEEPSEEK_MAIL !== undefined) {
      merged.DEEPSEEK_MAIL = config.DEEPSEEK_MAIL;
    }

    if (config?.DEEPSEEK_PASSWORD !== undefined) {
      merged.DEEPSEEK_PASSWORD = config.DEEPSEEK_PASSWORD;
    }

    // OpenAI
    if (config?.OPENAI_MAIL !== undefined) {
      merged.OPENAI_MAIL = config.OPENAI_MAIL;
    }

    if (config?.OPENAI_PASSWORD !== undefined) {
      merged.OPENAI_PASSWORD = config.OPENAI_PASSWORD;
    }

    // Ollama
    if (config?.OLLAMA_URL !== undefined) {
      merged.OLLAMA_URL = config.OLLAMA_URL;
    }

    if (config?.OLLAMA_MODEL !== undefined) {
      merged.OLLAMA_MODEL = config.OLLAMA_MODEL;
    }

    // 日付情報
    if (config?.CURRENT_DAY_OF_WEEK !== undefined) {
      merged.CURRENT_DAY_OF_WEEK = config.CURRENT_DAY_OF_WEEK;
    }

    // =============================================================
    // 3) ini.json → Redux 反映用 merged
    // =============================================================
    const apiSettings = ini?.apiSettings ?? {};
    const uiSettings = ini?.appSettings?.ui ?? {};

    const databaseType = normalizeDatabaseType(apiSettings.databaseType);

    const autoSynchronization = toBooleanFlag(
      apiSettings.autoSynchronization,
      true
    );

    const autoSwitching = false;

    merged.DATABASE_TYPE = databaseType;
    merged.USE_AI = apiSettings.useAI || "gemini";

    merged.AUTO_SYNCHRONIZATION = autoSynchronization;
    merged.AUTO_SWITCHING = autoSwitching;
    merged.closeButtonsVisible = toBooleanFlag(
      uiSettings.showCloseButtons,
      true
    );

    if (apiSettings.facilityId != null) {
      merged.FACILITY_ID = String(apiSettings.facilityId);
    }

    if (apiSettings.debugFlg != null) {
      merged.DEBUG_FLG = toBooleanFlag(apiSettings.debugFlg, false);
    }

    if (apiSettings.baseURL !== undefined) {
      merged.VITE_API_BASE_URL = apiSettings.baseURL || "";
    }

    console.log("🧾 [initializeAppState] apiSettings normalized:", {
      rawDatabaseType: apiSettings.databaseType,
      databaseType,

      rawAutoSynchronization: apiSettings.autoSynchronization,
      autoSynchronization,

      rawAutoSwitching: apiSettings.autoSwitching,
      autoSwitching,

      rawUseAI: apiSettings.useAI,
      useAI: merged.USE_AI,

      rawFacilityId: apiSettings.facilityId,
      FACILITY_ID: merged.FACILITY_ID,

      rawDebugFlg: apiSettings.debugFlg,
      DEBUG_FLG: merged.DEBUG_FLG,

      rawShowCloseButtons: uiSettings.showCloseButtons,
      closeButtonsVisible: merged.closeButtonsVisible,

      CURRENT_DAY_OF_WEEK: merged.CURRENT_DAY_OF_WEEK,
    });

    // =============================================================
    // 4) Redux 反映
    // =============================================================
    dispatch(updateAppState(merged));

    // =============================================================
    // 5) 初期化完了
    //
    // ここで true にすることで、
    // useDataBase({ autoLoad: true }) 側がDB取得を開始できる
    // =============================================================
    setIsInitialized(true);

    console.log("✅ [initializeAppState] 初期化完了:", {
      DATABASE_TYPE: merged.DATABASE_TYPE,
      STAFF_ID: merged.STAFF_ID,
      FACILITY_ID: merged.FACILITY_ID,
      CURRENT_DAY_OF_WEEK: merged.CURRENT_DAY_OF_WEEK,
      AUTO_SYNCHRONIZATION: merged.AUTO_SYNCHRONIZATION,
      AUTO_SWITCHING: merged.AUTO_SWITCHING,
    });

    console.groupEnd();

    return {
      config,
      ini,
    };
  } catch (error) {
    console.error("❌ [initializeAppState] 初期化エラー:", error);

    // 初期化に失敗してもアプリを完全停止させない
    setIsInitialized(true);

    console.groupEnd();

    return {
      config: null,
      ini: null,
    };
  }
}
