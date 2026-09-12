// src/store/slices/appStateSlice.js
// アプリケーション状態の管理

import { createSlice } from '@reduxjs/toolkit'
import { getDateString, getTodayWeekdayId } from '@/utils/date/dateUtils.js'
import { getTodayYmdString } from '@/utils/date/dateYMD.js'

const toBooleanFlag = (value, defaultValue = true) => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return defaultValue
}


// ✅ 修正: モード4を許可
const normalizeSelectChildFilterMode = (value) => {
  const mode = Number(value)
  // モード0, 1, 2, 3, 4 を許可
  return (mode === 0 || mode === 1 || mode === 2 || mode === 3 || mode === 4) ? mode : 1
  // デフォルトは1（選択施設）
}

// 初期状態
const initialState = {
  // 認証情報
  HUG_USERNAME: "",
  HUG_PASSWORD: "",

  // Gemini 用
  GEMINI_API_KEY: "",
  GEMINI_MODEL: "",

  // OpenRouter 用
  OPEN_ROUTER_API_KEY: "",
  OPEN_ROUTER_MODEL: "",

  // DeepSeek 用
  DEEPSEEK_MAIL: "",
  DEEPSEEK_PASSWORD: "",

  // OpenAI 用の認証情報（config.json から読み込み）
  OPENAI_MAIL: "",
  OPENAI_PASSWORD: "",

  // Ollama 用
  OLLAMA_URL: "",
  OLLAMA_MODEL: "",

  // デバッグフラグ
  DEBUG_FLG: false,

  VITE_API_BASE_URL: "",
  USE_AI: "chatGPT",
  DATABASE_TYPE: "mariadb",

  // ini.json apiSettings 自動設定
  AUTO_SYNCHRONIZATION: true,
  AUTO_SWITCHING: true,

  // サーバ接続状態
  SERVER_CONNECTED: false,
  SERVER_CONNECTION_CHECKING: false,
  SERVER_CONNECTION_MESSAGE: "",
  SERVER_CONNECTION_CHECKED_AT: null,

  // ID・日付・選択状態
  STAFF_ID: "",
  FACILITY_ID: "",
  CURRENT_DAY_OF_WEEK: {
    dateStr: getDateString(),
    weekdayId: getTodayWeekdayId(),
  },

  CURRENT_YMD: getTodayYmdString(),

  // UI状態
  closeButtonsVisible: true,
  SELECT_CHILD_FILTER_MODE: 1,

  // マスターデータ
  STAFF_DATA: [],
  FACILITY_DATA: [],
  STAFF_AND_FACILITY_DATA: [],

  // 出勤データ一覧（児童対応一覧データ）
  attendanceData: [],

  // プロンプトデータ
  PROMPTS: {},

  // アクティブ webview の URL
  ACTIVE_WEBVIEW_URL: "",
}

// Sliceの作成
const appStateSlice = createSlice({
  name: 'appState',
  initialState,
  reducers: {
    // デバッグフラグを設定
    setDebugFlg: (state, action) => {
      state.DEBUG_FLG = action.payload === true
    },

    // 認証情報を設定
    setHugUsername: (state, action) => {
      state.HUG_USERNAME = action.payload || ""
    },

    setHugPassword: (state, action) => {
      state.HUG_PASSWORD = action.payload || ""
    },

    setGeminiApiKey: (state, action) => {
      state.GEMINI_API_KEY = action.payload || ""
    },

    setGeminiModel: (state, action) => {
      state.GEMINI_MODEL = action.payload || ""
    },

    setOpenRouterApiKey: (state, action) => {
      state.OPEN_ROUTER_API_KEY = action.payload || ""
    },

    setOpenRouterModel: (state, action) => {
      state.OPEN_ROUTER_MODEL = action.payload || ""
    },

    // DeepSeek メール / パスワードを設定
    setDeepSeekMail: (state, action) => {
      state.DEEPSEEK_MAIL = action.payload || ""
    },

    setDeepSeekPassword: (state, action) => {
      state.DEEPSEEK_PASSWORD = action.payload || ""
    },

    // OpenAI メール / パスワードを設定
    setOpenaiMail: (state, action) => {
      state.OPENAI_MAIL = action.payload || ""
    },

    setOpenaiPassword: (state, action) => {
      state.OPENAI_PASSWORD = action.payload || ""
    },

    setOllamaUrl: (state, action) => {
      state.OLLAMA_URL = action.payload || ""
    },

    setOllamaModel: (state, action) => {
      state.OLLAMA_MODEL = action.payload || ""
    },

    // 施設IDを設定
    setFacilityId: (state, action) => {
      state.FACILITY_ID = action.payload || ""
    },

    // スタッフIDを設定
    setStaffId: (state, action) => {
      state.STAFF_ID = action.payload != null ? String(action.payload) : ""
    },

    // UI状態を設定
    setCloseButtonsVisible: (state, action) => {
      state.closeButtonsVisible =
        action.payload !== undefined ? action.payload : true
    },

    setSelectChildFilterMode: (state, action) => {
      state.SELECT_CHILD_FILTER_MODE =
        normalizeSelectChildFilterMode(action.payload)
    },

    // マスターデータを設定
    setStaffData: (state, action) => {
      state.STAFF_DATA = action.payload || []
    },

    setFacilityData: (state, action) => {
      state.FACILITY_DATA = action.payload || []
    },

    setStaffAndFacilityData: (state, action) => {
      state.STAFF_AND_FACILITY_DATA = action.payload || []
    },

    // 出勤データを設定
    setAttendanceData: (state, action) => {
      state.attendanceData = action.payload || []
    },

    // AI種別を設定
    setUseAI: (state, action) => {
      state.USE_AI = action.payload || "ollama"
    },

    // DB種別を設定
    setDatabaseType: (state, action) => {
      state.DATABASE_TYPE = action.payload || "mariadb"
    },

    // 自動同期を設定
    setAutoSynchronization: (state, action) => {
      state.AUTO_SYNCHRONIZATION = toBooleanFlag(action.payload, true)
    },

    // 自動切替を設定
    setAutoSwitching: (state, action) => {
      state.AUTO_SWITCHING = toBooleanFlag(action.payload, true)
    },

    // サーバ接続状態を設定
    setServerConnectionState: (state, action) => {
      const {
        connected,
        checking,
        message,
        checkedAt,
      } = action.payload || {}

      if (connected !== undefined) {
        state.SERVER_CONNECTED = connected === true
      }

      if (checking !== undefined) {
        state.SERVER_CONNECTION_CHECKING = checking === true
      }

      if (message !== undefined) {
        state.SERVER_CONNECTION_MESSAGE = message || ""
      }

      if (checkedAt !== undefined) {
        state.SERVER_CONNECTION_CHECKED_AT = checkedAt
      }
    },

    // プロンプトデータ設定
    setPrompts: (state, action) => {
      state.PROMPTS = action.payload || {}
    },

    setCurrentDate: (state, action) => {
      const { dateStr, weekdayId } = action.payload || {}

      if (dateStr !== undefined) {
        state.CURRENT_DAY_OF_WEEK.dateStr = dateStr
      }

      if (weekdayId !== undefined) {
        state.CURRENT_DAY_OF_WEEK.weekdayId = weekdayId
      }
    },

    setCurrentYmd: (state, action) => {
      if (typeof action.payload === 'string') {
        state.CURRENT_YMD = action.payload
      }
    },

    setActiveWebviewUrl: (state, action) => {
      state.ACTIVE_WEBVIEW_URL = action.payload || ""
    },

    // 複数の状態を一度に更新
    updateAppState: (state, action) => {
      const updates = action.payload || {}

      // デバッグフラグ
      if (updates.DEBUG_FLG !== undefined) {
        state.DEBUG_FLG = updates.DEBUG_FLG === true
      }

      // 認証情報
      if (updates.HUG_USERNAME !== undefined) {
        state.HUG_USERNAME = updates.HUG_USERNAME
      }

      if (updates.HUG_PASSWORD !== undefined) {
        state.HUG_PASSWORD = updates.HUG_PASSWORD
      }

      if (updates.GEMINI_API_KEY !== undefined) {
        state.GEMINI_API_KEY = updates.GEMINI_API_KEY
      }

      if (updates.GEMINI_MODEL !== undefined) {
        state.GEMINI_MODEL = updates.GEMINI_MODEL
      }

      if (updates.OPEN_ROUTER_API_KEY !== undefined) {
        state.OPEN_ROUTER_API_KEY = updates.OPEN_ROUTER_API_KEY
      }

      if (updates.OPEN_ROUTER_MODEL !== undefined) {
        state.OPEN_ROUTER_MODEL = updates.OPEN_ROUTER_MODEL
      }

      if (updates.DEEPSEEK_MAIL !== undefined) {
        state.DEEPSEEK_MAIL = updates.DEEPSEEK_MAIL
      }

      if (updates.DEEPSEEK_PASSWORD !== undefined) {
        state.DEEPSEEK_PASSWORD = updates.DEEPSEEK_PASSWORD
      }

      if (updates.OPENAI_MAIL !== undefined) {
        state.OPENAI_MAIL = updates.OPENAI_MAIL
      }

      if (updates.OPENAI_PASSWORD !== undefined) {
        state.OPENAI_PASSWORD = updates.OPENAI_PASSWORD
      }

      if (updates.OLLAMA_URL !== undefined) {
        state.OLLAMA_URL = updates.OLLAMA_URL
      }

      if (updates.OLLAMA_MODEL !== undefined) {
        state.OLLAMA_MODEL = updates.OLLAMA_MODEL
      }

      if (updates.VITE_API_BASE_URL !== undefined) {
        state.VITE_API_BASE_URL = updates.VITE_API_BASE_URL
      }

      // サーバ接続状態
      if (updates.SERVER_CONNECTED !== undefined) {
        state.SERVER_CONNECTED = updates.SERVER_CONNECTED === true
      }

      if (updates.SERVER_CONNECTION_CHECKING !== undefined) {
        state.SERVER_CONNECTION_CHECKING =
          updates.SERVER_CONNECTION_CHECKING === true
      }

      if (updates.SERVER_CONNECTION_MESSAGE !== undefined) {
        state.SERVER_CONNECTION_MESSAGE =
          updates.SERVER_CONNECTION_MESSAGE || ""
      }

      if (updates.SERVER_CONNECTION_CHECKED_AT !== undefined) {
        state.SERVER_CONNECTION_CHECKED_AT =
          updates.SERVER_CONNECTION_CHECKED_AT
      }

      // ID・日付・選択状態
      if (updates.STAFF_ID !== undefined) {
        state.STAFF_ID =
          updates.STAFF_ID != null ? String(updates.STAFF_ID) : ""
      }

      if (updates.FACILITY_ID !== undefined) {
        state.FACILITY_ID = updates.FACILITY_ID
      }

      if (updates.CURRENT_DAY_OF_WEEK !== undefined) {
        state.CURRENT_DAY_OF_WEEK = {
          ...state.CURRENT_DAY_OF_WEEK,
          ...updates.CURRENT_DAY_OF_WEEK,
        }
      }

      if (updates.CURRENT_YMD !== undefined) {
        state.CURRENT_YMD = updates.CURRENT_YMD
      }

      // UI状態
      if (updates.closeButtonsVisible !== undefined) {
        state.closeButtonsVisible = updates.closeButtonsVisible
      }

      if (updates.SELECT_CHILD_FILTER_MODE !== undefined) {
        state.SELECT_CHILD_FILTER_MODE =
          normalizeSelectChildFilterMode(updates.SELECT_CHILD_FILTER_MODE)
      }

      // マスターデータ
      if (updates.STAFF_DATA !== undefined) {
        state.STAFF_DATA = updates.STAFF_DATA
      }

      if (updates.FACILITY_DATA !== undefined) {
        state.FACILITY_DATA = updates.FACILITY_DATA
      }

      if (updates.STAFF_AND_FACILITY_DATA !== undefined) {
        state.STAFF_AND_FACILITY_DATA = updates.STAFF_AND_FACILITY_DATA
      }

      // 出勤データ
      if (updates.attendanceData !== undefined) {
        state.attendanceData = updates.attendanceData
      }

      // AI種別 / DB種別
      if (updates.USE_AI !== undefined) {
        state.USE_AI = updates.USE_AI
      }

      if (updates.DATABASE_TYPE !== undefined) {
        state.DATABASE_TYPE = updates.DATABASE_TYPE
      }

      // 自動同期 / 自動切替
      if (updates.AUTO_SYNCHRONIZATION !== undefined) {
        state.AUTO_SYNCHRONIZATION = toBooleanFlag(
          updates.AUTO_SYNCHRONIZATION,
          true
        )
      }

      if (updates.AUTO_SWITCHING !== undefined) {
        state.AUTO_SWITCHING = toBooleanFlag(
          updates.AUTO_SWITCHING,
          true
        )
      }

      // apiSettings のキー名そのままで渡された場合にも対応
      if (updates.autoSynchronization !== undefined) {
        state.AUTO_SYNCHRONIZATION = toBooleanFlag(
          updates.autoSynchronization,
          true
        )
      }

      if (updates.autoSwitching !== undefined) {
        state.AUTO_SWITCHING = toBooleanFlag(
          updates.autoSwitching,
          true
        )
      }

      // プロンプト
      if (updates.PROMPTS !== undefined) {
        state.PROMPTS = updates.PROMPTS
      }

      // Webview
      if (updates.ACTIVE_WEBVIEW_URL !== undefined) {
        state.ACTIVE_WEBVIEW_URL = updates.ACTIVE_WEBVIEW_URL
      }
    },

    // すべての状態をリセット
    resetAppState: () => initialState,
  },
})

// アクションのエクスポート
export const {
  setHugUsername,
  setHugPassword,

  setGeminiApiKey,
  setGeminiModel,

  setOpenRouterApiKey,
  setOpenRouterModel,

  setDeepSeekMail,
  setDeepSeekPassword,

  setOpenaiMail,
  setOpenaiPassword,

  setOllamaUrl,
  setOllamaModel,

  setFacilityId,
  setStaffId,
  setCurrentDate,
  setCurrentYmd,
  setCloseButtonsVisible,
  setSelectChildFilterMode,
  setStaffData,
  setFacilityData,
  setStaffAndFacilityData,
  setAttendanceData,

  setUseAI,
  setDatabaseType,
  setAutoSynchronization,
  setAutoSwitching,

  setServerConnectionState,
  updateAppState,
  resetAppState,

  setDebugFlg,
  setPrompts,
  setActiveWebviewUrl,
} = appStateSlice.actions

// セレクターのエクスポート
export const selectHugUsername = (state) => state.appState.HUG_USERNAME
export const selectHugPassword = (state) => state.appState.HUG_PASSWORD

export const selectGeminiApiKey = (state) => state.appState.GEMINI_API_KEY
export const selectGeminiModel = (state) => state.appState.GEMINI_MODEL

export const selectOpenRouterApiKey = (state) =>
  state.appState.OPEN_ROUTER_API_KEY

export const selectOpenRouterModel = (state) =>
  state.appState.OPEN_ROUTER_MODEL

export const selectDeepSeekMail = (state) =>
  state.appState.DEEPSEEK_MAIL

export const selectDeepSeekPassword = (state) =>
  state.appState.DEEPSEEK_PASSWORD

export const selectOpenaiMail = (state) =>
  state.appState.OPENAI_MAIL

export const selectOpenaiPassword = (state) =>
  state.appState.OPENAI_PASSWORD

export const selectOllamaUrl = (state) =>
  state.appState.OLLAMA_URL

export const selectOllamaModel = (state) =>
  state.appState.OLLAMA_MODEL

export const selectViteApiBaseUrl = (state) =>
  state.appState.VITE_API_BASE_URL

export const selectUseAI = (state) =>
  state.appState.USE_AI

export const selectDatabaseType = (state) =>
  state.appState.DATABASE_TYPE

export const selectAutoSynchronization = (state) =>
  state.appState.AUTO_SYNCHRONIZATION

export const selectAutoSwitching = (state) =>
  state.appState.AUTO_SWITCHING

export const selectServerConnected = (state) =>
  state.appState.SERVER_CONNECTED

export const selectServerConnectionChecking = (state) =>
  state.appState.SERVER_CONNECTION_CHECKING

export const selectServerConnectionMessage = (state) =>
  state.appState.SERVER_CONNECTION_MESSAGE

export const selectServerConnectionCheckedAt = (state) =>
  state.appState.SERVER_CONNECTION_CHECKED_AT

export const selectStaffId = (state) =>
  state.appState.STAFF_ID

export const selectFacilityId = (state) =>
  state.appState.FACILITY_ID

export const selectCurrentDate = (state) =>
  state.appState.CURRENT_DAY_OF_WEEK

export const selectCurrentYmd = (state) =>
  state.appState.CURRENT_YMD

export const selectCloseButtonsVisible = (state) =>
  state.appState.closeButtonsVisible

export const selectSelectChildFilterMode = (state) =>
  state.appState.SELECT_CHILD_FILTER_MODE

export const selectStaffData = (state) =>
  state.appState.STAFF_DATA

export const selectFacilityData = (state) =>
  state.appState.FACILITY_DATA

export const selectStaffAndFacilityData = (state) =>
  state.appState.STAFF_AND_FACILITY_DATA

export const selectAttendanceData = (state) =>
  state.appState.attendanceData

export const selectAppState = (state) =>
  state.appState

export const selectDebugFlg = (state) =>
  state.appState.DEBUG_FLG

export const selectPrompts = (state) =>
  state.appState.PROMPTS

export const selectActiveWebviewUrl = (state) =>
  state.appState.ACTIVE_WEBVIEW_URL

// リデューサーのエクスポート
export default appStateSlice.reducer