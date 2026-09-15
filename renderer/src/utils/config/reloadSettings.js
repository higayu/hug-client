// src/utils/reloadSettings.js
// config.json と ini.json の両方を再読み込みしてUIに反映

import {
  loadConfig,
  loadIni as loadIniFromUtils,
} from "./index";
import { store } from '@/store/store.js'
import {
  updateAppState,
  setDatabaseType,
  setUseAI,
  setFacilityId,
  setDebugFlg,
  setAutoSynchronization,
  setAutoSwitching,
} from '@/store/slices/appStateSlice.js'

const toBooleanFlag = (value, defaultValue = true) => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return defaultValue
}

const applyCloseButtonsVisibility = (visible) => {
  document.querySelectorAll('.close-btn').forEach((button) => {
    button.style.display = visible ? 'inline' : 'none'
  })
}

const syncFormValue = (elementId, value) => {
  const element = document.getElementById(elementId)

  if (!element) {
    return
  }

  if (element.type === 'checkbox') {
    element.checked = value === true
  } else {
    element.value = String(value)
  }

  console.log(`🖥 [reloadSettings] ${elementId} 同期:`, value)
}

/**
 * config.json と ini.json の両方を再読み込みしてUIに反映
 *
 * 方針:
 * - activeApi は使わない
 * - sqliteApi / mariadbApi はここでは import しない
 * - DATABASE_TYPE を Redux の正本にする
 * - reloadSettings は「設定ファイルを読み込んで Redux に反映するだけ」にする
 *
 * @returns {Promise<boolean>} 成功なら true
 */
export async function loadAllReload() {
  try {
    console.log('🔄 全設定リロード開始...')

    // =============================================================
    // 1) config.json 読み込み
    // =============================================================
    const configData = await loadConfig()

    if (!configData) {
      console.warn('⚠️ config.json の読み込みに失敗しました')
      return false
    }

    console.log('📄 [reloadSettings] config.json:', configData)

    // =============================================================
    // 2) config.json → Redux
    // =============================================================
    store.dispatch(
      updateAppState({
        HUG_USERNAME: configData.HUG_USERNAME,
        HUG_PASSWORD: configData.HUG_PASSWORD,

        GEMINI_API_KEY: configData.GEMINI_API_KEY,
        GEMINI_MODEL: configData.GEMINI_MODEL,

        OPEN_ROUTER_API_KEY: configData.OPEN_ROUTER_API_KEY,
        OPEN_ROUTER_MODEL: configData.OPEN_ROUTER_MODEL,

        DEEPSEEK_MAIL: configData.DEEPSEEK_MAIL,
        DEEPSEEK_PASSWORD: configData.DEEPSEEK_PASSWORD,

        OPENAI_MAIL: configData.OPENAI_MAIL,
        OPENAI_PASSWORD: configData.OPENAI_PASSWORD,

        OLLAMA_URL: configData.OLLAMA_URL,
        OLLAMA_MODEL: configData.OLLAMA_MODEL,
      })
    )

    // =============================================================
    // 4) ini.json 読み込み
    // =============================================================
    const iniData = await loadIniFromUtils()

    if (!iniData) {
      console.warn('⚠️ ini.json の読み込みに失敗しました')
      return false
    }

    console.log('📄 [reloadSettings] ini.json:', iniData)

    const apiSettings = iniData.apiSettings || {}
    const uiSettings = iniData.appSettings?.ui || {}

    const databaseType = apiSettings.databaseType || 'sqlite'
    const useAI = apiSettings.useAI || 'gemini'
    const facilityId =
      apiSettings.facilityId != null ? String(apiSettings.facilityId) : ''
    const baseURL = apiSettings.baseURL || ''

    const debugFlg =
      apiSettings.debugFlg === true || apiSettings.debugFlg === 'true'

    const autoSynchronization = toBooleanFlag(
      apiSettings.autoSynchronization,
      true
    )

    const autoSwitching = toBooleanFlag(
      apiSettings.autoSwitching,
      true
    )

    const closeButtonsVisible = toBooleanFlag(
      uiSettings.showCloseButtons,
      true
    )

    console.log('[reloadSettings] apiSettings normalized:', {
      databaseType,
      useAI,
      facilityId,
      baseURL,
      debugFlg,
      autoSynchronization,
      autoSwitching,
      closeButtonsVisible,
    })

    // =============================================================
    // 5) ini.json → Redux
    // =============================================================
    store.dispatch(setDatabaseType(databaseType))
    store.dispatch(setUseAI(useAI))
    store.dispatch(setFacilityId(facilityId))
    store.dispatch(setDebugFlg(debugFlg))
    store.dispatch(setAutoSynchronization(autoSynchronization))
    store.dispatch(setAutoSwitching(autoSwitching))

    store.dispatch(
      updateAppState({
        DATABASE_TYPE: databaseType,
        USE_AI: useAI,
        FACILITY_ID: facilityId,
        VITE_API_BASE_URL: baseURL,
        DEBUG_FLG: debugFlg,
        AUTO_SYNCHRONIZATION: autoSynchronization,
        AUTO_SWITCHING: autoSwitching,
        closeButtonsVisible,
      })
    )

    applyCloseButtonsVisibility(closeButtonsVisible)

    // =============================================================
    // 6) Context 側の iniState も同期
    // =============================================================
    if (window.IniState?.loadIni) {
      await window.IniState.loadIni()
      console.log('✅ [reloadSettings] window.IniState.loadIni 実行完了')
    } else {
      console.warn('⚠️ [reloadSettings] window.IniState.loadIni が未初期化')
    }


    // =============================================================
    // 7) ApiTab / select 表示同期
    // =============================================================
    syncFormValue('api-database-type', databaseType)
    syncFormValue('api-ai-type', useAI)
    syncFormValue('api-facility-id', facilityId)
    syncFormValue('api-base-url', baseURL)

    // 画面側に同名IDの input / checkbox がある場合だけ同期されます
    syncFormValue('api-auto-synchronization', autoSynchronization)
    syncFormValue('api-auto-switching', autoSwitching)
    syncFormValue('show-close-buttons', closeButtonsVisible)

    // =============================================================
    // 8) DB種別変更イベントを発火
    // useDataBase 側で再取得するため
    // =============================================================
    window.dispatchEvent(
      new CustomEvent('database-type-changed', {
        detail: {
          databaseType,
          autoSynchronization,
          autoSwitching,
          message: `設定再読み込みにより ${databaseType} に切り替えました`,
          checkedAt: new Date().toISOString(),
          source: 'reloadSettings.loadAllReload',
        },
      })
    )

    // =============================================================
    // 9) その他UIへ設定更新通知
    // =============================================================
    document.dispatchEvent(
      new CustomEvent('app-settings-reloaded', {
        detail: {
          configData,
          iniData,
          databaseType,
          useAI,
          autoSynchronization,
          autoSwitching,
          closeButtonsVisible,
        },
      })
    )

    console.log('✅ 全設定リロード完了')
    return true
  } catch (err) {
    console.error('❌ 全設定リロード中にエラー:', err)
    return false
  }
}
