// renderer/src/store/slices/modeSlice.js
// アプリケーションの表示モード・選択画面管理

import { createSlice } from '@reduxjs/toolkit'

/**
 * アプリケーション全体の表示モード
 */
export const APP_MODES = Object.freeze({
  DASHBOARD: 'dashboard',
  AI_INQUIRY: 'aiInquiry',
})

/**
 * モード内で表示する画面
 *
 * AppRouterのswitch文と一致させる
 */
export const APP_SCREENS = Object.freeze({
  DASHBOARD: 'dashboard',
  AI_RECORD_EDITER: 'aiRecordEditer',
  CHAT: 'chat',
  PERSONAL_RECORD: 'personalRecord',
  HEALTH_ANALYSIS: 'healthAnalysis',
})

const VALID_MODES = Object.values(APP_MODES)

/**
 * 各モードの初期表示画面
 */
export const DEFAULT_SELECTED_ITEM_BY_MODE =
  Object.freeze({
    [APP_MODES.DASHBOARD]:
      APP_SCREENS.DASHBOARD,

    [APP_MODES.AI_INQUIRY]:
      APP_SCREENS.CHAT,
  })

const createInitialState = () => ({
  /**
   * 現在のアプリケーションモード
   */
  currentMode: APP_MODES.DASHBOARD,

  /**
   * モードごとに最後に選択した画面を保持
   */
  selectedItemIdByMode: {
    ...DEFAULT_SELECTED_ITEM_BY_MODE,
  },
})

const initialState = createInitialState()

/**
 * 有効なモードへ変換
 */
const resolveMode = (
  requestedMode,
  fallbackMode = APP_MODES.DASHBOARD
) => {
  return VALID_MODES.includes(requestedMode)
    ? requestedMode
    : fallbackMode
}

const modeSlice = createSlice({
  name: 'mode',

  initialState,

  reducers: {
    /**
     * アプリケーションモードを変更
     */
    setMode: (state, action) => {
      const mode = resolveMode(
        action.payload
      )

      state.currentMode = mode

      if (!state.selectedItemIdByMode) {
        state.selectedItemIdByMode = {
          ...DEFAULT_SELECTED_ITEM_BY_MODE,
        }
      }

      if (!state.selectedItemIdByMode[mode]) {
        state.selectedItemIdByMode[mode] =
          DEFAULT_SELECTED_ITEM_BY_MODE[mode]
      }
    },

    /**
     * モード内の表示画面を変更
     *
     * payload:
     * {
     *   mode?: 'dashboard' | 'aiInquiry',
     *   itemId: string
     * }
     *
     * modeを省略した場合は現在のモードへ保存
     */
    setSelectedItem: (state, action) => {
      const itemId =
        action.payload?.itemId

      if (
        typeof itemId !== 'string' ||
        itemId.trim() === ''
      ) {
        return
      }

      const mode = resolveMode(
        action.payload?.mode,
        state.currentMode
      )

      if (!state.selectedItemIdByMode) {
        state.selectedItemIdByMode = {
          ...DEFAULT_SELECTED_ITEM_BY_MODE,
        }
      }

      state.selectedItemIdByMode[mode] =
        itemId.trim()
    },

    /**
     * dashboardモードへ戻す
     *
     * 各モードで選択していた画面は維持
     */
    resetMode: (state) => {
      state.currentMode =
        APP_MODES.DASHBOARD
    },

    /**
     * 指定モードの表示画面を初期値へ戻す
     */
    resetModeSelection: (
      state,
      action
    ) => {
      const mode = resolveMode(
        action.payload,
        state.currentMode
      )

      if (!state.selectedItemIdByMode) {
        state.selectedItemIdByMode = {
          ...DEFAULT_SELECTED_ITEM_BY_MODE,
        }
      }

      state.selectedItemIdByMode[mode] =
        DEFAULT_SELECTED_ITEM_BY_MODE[mode]
    },

    /**
     * モードと表示画面をすべて初期化
     */
    resetModeState: () => {
      return createInitialState()
    },
  },
})

export const {
  setMode,
  setSelectedItem,
  resetMode,
  resetModeSelection,
  resetModeState,
} = modeSlice.actions

/**
 * modeSlice全体
 */
export const selectModeState = (state) =>
  state.mode ?? initialState

/**
 * 現在のアプリケーションモード
 */
export const selectCurrentMode = (state) =>
  state.mode?.currentMode ??
  APP_MODES.DASHBOARD

/**
 * 指定モードで選択中の画面
 */
export const selectSelectedItemIdByMode = (
  state,
  requestedMode
) => {
  const mode = resolveMode(
    requestedMode
  )

  return (
    state.mode?.selectedItemIdByMode?.[
      mode
    ] ??
    DEFAULT_SELECTED_ITEM_BY_MODE[mode]
  )
}

/**
 * 現在のモードで選択中の画面
 */
export const selectCurrentSelectedItemId = (
  state
) => {
  const currentMode =
    selectCurrentMode(state)

  return selectSelectedItemIdByMode(
    state,
    currentMode
  )
}

/**
 * dashboardモードで選択中の画面
 */
export const selectDashboardSelectedItemId = (
  state
) => {
  return selectSelectedItemIdByMode(
    state,
    APP_MODES.DASHBOARD
  )
}

/**
 * AI問い合わせモードで選択中の画面
 */
export const selectAiInquirySelectedItemId = (
  state
) => {
  return selectSelectedItemIdByMode(
    state,
    APP_MODES.AI_INQUIRY
  )
}

export const selectIsDashboardMode = (
  state
) => {
  return (
    selectCurrentMode(state) ===
    APP_MODES.DASHBOARD
  )
}

export const selectIsAiInquiryMode = (
  state
) => {
  return (
    selectCurrentMode(state) ===
    APP_MODES.AI_INQUIRY
  )
}

export default modeSlice.reducer
