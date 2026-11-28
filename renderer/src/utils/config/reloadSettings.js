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
} from '@/store/slices/appStateSlice.js'

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

  void 0
}

/**
 * config.json と ini.json の両方を再読み込みしてUIに反映
 *
 * 方針:
 * - activeApi は使わない
 * - DB API はここでは import しない
 * - DATABASE_TYPE を Redux の正本にする
 * - reloadSettings は「設定ファイルを読み込んで Redux に反映するだけ」にする
 *
 * @returns {Promise<boolean>} 成功なら true
 */
export async function loadAllReload() {
  try {
    void 0

    // =============================================================
    // 1) config.json 読み込み
    // =============================================================
    const configData = await loadConfig()

    if (!configData) {
      console.warn('⚠️ config.json の読み込みに失敗しました')
      return false
    }

    void 0

    // =============================================================
    // 3) config.json → Redux
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

    void 0

    const apiSettings = iniData.apiSettings || {}

    const databaseType = 'laravel'
    const useAI = apiSettings.useAI || 'LaravelApi'
    const facilityId =
      apiSettings.facilityId != null ? String(apiSettings.facilityId) : ''
    const baseURL = apiSettings.baseURL || ''

    const debugFlg =
      apiSettings.debugFlg === true || apiSettings.debugFlg === 'true'

    void 0

    // =============================================================
    // 5) ini.json → Redux
    // =============================================================
    store.dispatch(setDatabaseType(databaseType))
    store.dispatch(setUseAI(useAI))
    store.dispatch(setFacilityId(facilityId))
    store.dispatch(setDebugFlg(debugFlg))

    store.dispatch(
      updateAppState({
        DATABASE_TYPE: databaseType,
        USE_AI: useAI,
        FACILITY_ID: facilityId,
        VITE_API_BASE_URL: baseURL,
        DEBUG_FLG: debugFlg,
      })
    )

    // =============================================================
    // 6) Context 側の iniState も同期
    // =============================================================
    if (window.IniState?.loadIni) {
      await window.IniState.loadIni()
      void 0
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

    // =============================================================
    // 8) DB種別変更イベントを発火
    // useDataBase 側で再取得するため
    // =============================================================
    window.dispatchEvent(
      new CustomEvent('database-type-changed', {
        detail: {
          databaseType,
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
        },
      })
    )

    void 0
    return true
  } catch (err) {
    console.error('❌ 全設定リロード中にエラー:', err)
    return false
  }
}
