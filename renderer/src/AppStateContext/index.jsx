// AppStateContext/index.jsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { useReduxBindings } from './useReduxBindings'
import { useWindowBridge } from './useWindowBridge'
import { initializeAppState } from './useAppInitializer'

import {
  setCurrentDate as setCurrentDateRedux,
  setAttendanceData as setAttendanceDataRedux,
  updateAppState as updateAppStateRedux,
  setCurrentYmd as setCurrentYmdRedux,
  setSelectChildFilterMode as setSelectChildFilterModeRedux,
  setDatabaseType as setDatabaseTypeRedux,
  setUseAI as setUseAIRedux,
  setStaffId as setStaffIdRedux,
  setFacilityId as setFacilityIdRedux,
  setDebugFlg as setDebugFlgRedux,
  setServerConnectionState as setServerConnectionStateRedux,
  setAutoSynchronization as setAutoSynchronizationRedux,
  setAutoSwitching as setAutoSwitchingRedux,
} from '@/store/slices/appStateSlice'

import {
  setActiveSpaceId as setActiveSpaceIdRedux,
  setSpaceChild as setSpaceChildRedux,
  setSpacePcName as setSpacePcNameRedux,
  setSpaceChildColumns as setSpaceChildColumnsRedux,
  clearSpace as clearSpaceRedux,
  resetChilledspace as resetChilledspaceRedux,
} from '@/store/slices/chilledspaceSlice'

import {
  APP_MODES,
  setMode as setModeRedux,
  setSelectedItem as setSelectedItemRedux,
  resetMode as resetModeRedux,
  resetModeSelection as resetModeSelectionRedux,
  resetModeState as resetModeStateRedux,
} from '@/store/slices/modeSlice'

import { loadIni as loadIniFromUtils } from '@/utils/config/iniUtils'
import { selectAuthenticatedStaffId } from '@/store/slices/authSlice'

const AppStateContext = createContext(null)

export const FAN_CONTENT_PANELS = {
  AI_SUPPORT: 'ai',
  CHILD_KADAI: 'child-kadai',
  PERSONAL_RECORD: 'personal-record',
}

const toBooleanFlag = (value, defaultValue = true) => {
  if (value === true || value === 'true') return true
  if (value === false || value === 'false') return false
  return defaultValue
}

const toIniBooleanString = (value, defaultValue = true) => {
  return String(toBooleanFlag(value, defaultValue))
}

const applyCloseButtonsVisibility = (visible) => {
  document.querySelectorAll('.close-btn').forEach((button) => {
    button.style.display = visible ? 'inline' : 'none'
  })
}

export function AppStateProvider({ children }) {
  const dispatch = useDispatch()
  const didInitRef = useRef(false)

  const redux = useReduxBindings()
  const authenticatedStaffId = useSelector(selectAuthenticatedStaffId)

  const [isInitialized, setIsInitialized] = useState(false)
  const [activeSidebarTab, setActiveSidebarTab] = useState('FanContent')

  const [iniState, setIniState] = useState({
    appSettings: {},
    userPreferences: {},
    apiSettings: {},
  })

  useEffect(() => {
    const staffId =
      authenticatedStaffId != null
        ? String(authenticatedStaffId)
        : ''

    if (redux.STAFF_ID !== staffId) {
      dispatch(setStaffIdRedux(staffId))
    }
  }, [authenticatedStaffId, dispatch, redux.STAFF_ID])

  useEffect(() => {
    applyCloseButtonsVisibility(redux.appState.closeButtonsVisible)
  }, [redux.appState.closeButtonsVisible])

  // =============================================================
  // 状態監視ログ
  // =============================================================
  useEffect(() => {
    console.group('[AppStateContext] render/state snapshot')
    console.log('isInitialized:', isInitialized)
    console.log('redux.DATABASE_TYPE:', redux.DATABASE_TYPE)
    console.log('redux.USE_AI:', redux.USE_AI)
    console.log('redux.STAFF_ID:', redux.STAFF_ID)
    console.log('redux.FACILITY_ID:', redux.FACILITY_ID)
    console.log('redux.DEBUG_FLG:', redux.DEBUG_FLG)
    console.log(
      'redux.AUTO_SYNCHRONIZATION:',
      redux.AUTO_SYNCHRONIZATION
    )
    console.log('redux.AUTO_SWITCHING:', redux.AUTO_SWITCHING)
    console.log('iniState.apiSettings:', iniState?.apiSettings)
    console.log(
      'iniState.apiSettings.databaseType:',
      iniState?.apiSettings?.databaseType
    )
    console.log(
      'iniState.apiSettings.autoSynchronization:',
      iniState?.apiSettings?.autoSynchronization
    )
    console.log(
      'iniState.apiSettings.autoSwitching:',
      iniState?.apiSettings?.autoSwitching
    )
    console.groupEnd()
  }, [
    isInitialized,
    redux.DATABASE_TYPE,
    redux.USE_AI,
    redux.STAFF_ID,
    redux.FACILITY_ID,
    redux.DEBUG_FLG,
    redux.AUTO_SYNCHRONIZATION,
    redux.AUTO_SWITCHING,
    iniState?.apiSettings,
  ])

  // ===== ini 操作 =====
  const loadIni = useCallback(async () => {
    console.group('[AppStateContext/loadIni] START')

    try {
      const iniData = await loadIniFromUtils()

      console.log('[AppStateContext/loadIni] 読み込んだ iniData:', iniData)
      console.log(
        '[AppStateContext/loadIni] iniData.apiSettings.databaseType:',
        iniData?.apiSettings?.databaseType
      )
      console.log(
        '[AppStateContext/loadIni] iniData.apiSettings.autoSynchronization:',
        iniData?.apiSettings?.autoSynchronization
      )
      console.log(
        '[AppStateContext/loadIni] iniData.apiSettings.autoSwitching:',
        iniData?.apiSettings?.autoSwitching
      )

      if (!iniData) {
        console.warn('[AppStateContext/loadIni] iniData が null/undefined')
        console.groupEnd()
        return null
      }

      const nextIniState = {
        appSettings: iniData.appSettings ?? {},
        userPreferences: iniData.userPreferences ?? {},
        apiSettings: iniData.apiSettings ?? {},
      }

      console.log('[AppStateContext/loadIni] setIniState する値:', nextIniState)

      setIniState(nextIniState)

      console.groupEnd()
      return iniData
    } catch (error) {
      console.error('[AppStateContext/loadIni] エラー:', error)
      console.groupEnd()
      return null
    }
  }, [])

  const saveIni = useCallback(
    async (override) => {
      console.group('[AppStateContext/saveIni] START')

      try {
        const source = override ?? iniState

        console.log('[AppStateContext/saveIni] 保存対象 source:', source)
        console.log(
          '[AppStateContext/saveIni] 保存 databaseType:',
          source?.apiSettings?.databaseType
        )
        console.log(
          '[AppStateContext/saveIni] 保存 autoSynchronization:',
          source?.apiSettings?.autoSynchronization
        )
        console.log(
          '[AppStateContext/saveIni] 保存 autoSwitching:',
          source?.apiSettings?.autoSwitching
        )

        const result = await window.electronAPI.saveIni({
          version: '1.0.0',
          appSettings: source.appSettings ?? {},
          userPreferences: source.userPreferences ?? {},
          apiSettings: source.apiSettings ?? {},
        })

        console.log('[AppStateContext/saveIni] 保存結果:', result)

        console.groupEnd()
        return result
      } catch (error) {
        console.error('[AppStateContext/saveIni] エラー:', error)
        console.groupEnd()
        return false
      }
    },
    [iniState]
  )

  const updateIniSetting = useCallback(async (path, value) => {
    console.group('[AppStateContext/updateIniSetting] START')
    console.log('path:', path)
    console.log('value:', value)

    try {
      const result = await window.electronAPI.updateIniSetting(path, value)

      console.log('[AppStateContext/updateIniSetting] IPC結果:', result)

      setIniState((prev) => {
        console.log('[AppStateContext/updateIniSetting] before iniState:', prev)

        const next = structuredClone(prev)
        const keys = path.split('.')
        let cur = next

        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]

          if (!cur[key]) {
            cur[key] = {}
          }

          cur = cur[key]
        }

        cur[keys.at(-1)] = value

        console.log('[AppStateContext/updateIniSetting] after iniState:', next)
        console.log(
          '[AppStateContext/updateIniSetting] after databaseType:',
          next?.apiSettings?.databaseType
        )
        console.log(
          '[AppStateContext/updateIniSetting] after autoSynchronization:',
          next?.apiSettings?.autoSynchronization
        )
        console.log(
          '[AppStateContext/updateIniSetting] after autoSwitching:',
          next?.apiSettings?.autoSwitching
        )

        return next
      })

      console.groupEnd()
      return result
    } catch (error) {
      console.error('[AppStateContext/updateIniSetting] エラー:', error)
      console.groupEnd()
      return null
    }
  }, [])

  const isFeatureEnabled = useCallback(
    (name) => iniState.appSettings.features?.[name]?.enabled ?? false,
    [iniState]
  )

  const getUISettings = useCallback(
    () => iniState.appSettings.ui,
    [iniState]
  )

  const getWindowSettings = useCallback(
    () => iniState.appSettings.window,
    [iniState]
  )

  const getApiSettings = useCallback(
    () => iniState.apiSettings ?? {},
    [iniState]
  )

  const isAutoSynchronizationEnabled = useCallback(() => {
    return toBooleanFlag(
      iniState?.apiSettings?.autoSynchronization,
      true
    )
  }, [iniState?.apiSettings?.autoSynchronization])

  const isAutoSwitchingEnabled = useCallback(() => {
    return toBooleanFlag(
      iniState?.apiSettings?.autoSwitching,
      true
    )
  }, [iniState?.apiSettings?.autoSwitching])

  const setAutoSynchronization = useCallback(
    async (enabled) => {
      const value = toIniBooleanString(enabled, true)

      console.group('[AppStateContext/setAutoSynchronization]')
      console.log('enabled:', enabled)
      console.log('save value:', value)

      try {
        const result = await updateIniSetting(
          'apiSettings.autoSynchronization',
          value
        )

        dispatch(setAutoSynchronizationRedux(toBooleanFlag(enabled, true)))

        console.groupEnd()
        return result
      } catch (error) {
        console.error('[AppStateContext/setAutoSynchronization] エラー:', error)
        console.groupEnd()
        return null
      }
    },
    [dispatch, updateIniSetting]
  )

  const setAutoSwitching = useCallback(
    async (enabled) => {
      const value = toIniBooleanString(enabled, true)

      console.group('[AppStateContext/setAutoSwitching]')
      console.log('enabled:', enabled)
      console.log('save value:', value)

      try {
        const result = await updateIniSetting(
          'apiSettings.autoSwitching',
          value
        )

        dispatch(setAutoSwitchingRedux(toBooleanFlag(enabled, true)))

        console.groupEnd()
        return result
      } catch (error) {
        console.error('[AppStateContext/setAutoSwitching] エラー:', error)
        console.groupEnd()
        return null
      }
    },
    [dispatch, updateIniSetting]
  )

  // ===== 初期化 =====
  useEffect(() => {
    console.group('[AppStateContext/init useEffect]')
    console.log('didInitRef.current:', didInitRef.current)

    if (didInitRef.current) {
      console.log('初期化済みのため return')
      console.groupEnd()
      return
    }

    didInitRef.current = true

    const init = async () => {
      console.group('[AppStateContext/init] START')

      try {
        const { ini } = await initializeAppState({
          dispatch,
          setIsInitialized,
        })

        console.log('[AppStateContext/init] initializeAppState returned ini:', ini)
        console.log(
          '[AppStateContext/init] returned ini databaseType:',
          ini?.apiSettings?.databaseType
        )
        console.log(
          '[AppStateContext/init] returned ini autoSynchronization:',
          ini?.apiSettings?.autoSynchronization
        )
        console.log(
          '[AppStateContext/init] returned ini autoSwitching:',
          ini?.apiSettings?.autoSwitching
        )

        const iniData = ini ?? (await loadIniFromUtils())

        console.log('[AppStateContext/init] 最終 iniData:', iniData)
        console.log(
          '[AppStateContext/init] 最終 iniData databaseType:',
          iniData?.apiSettings?.databaseType
        )
        console.log(
          '[AppStateContext/init] 最終 iniData autoSynchronization:',
          iniData?.apiSettings?.autoSynchronization
        )
        console.log(
          '[AppStateContext/init] 最終 iniData autoSwitching:',
          iniData?.apiSettings?.autoSwitching
        )

        if (iniData) {
          const nextIniState = {
            appSettings: iniData.appSettings ?? {},
            userPreferences: iniData.userPreferences ?? {},
            apiSettings: iniData.apiSettings ?? {},
          }

          console.log('[AppStateContext/init] setIniState:', nextIniState)

          setIniState(nextIniState)
        }
      } catch (error) {
        console.error('[AppStateContext/init] エラー:', error)
      } finally {
        console.groupEnd()
      }
    }

    init()

    console.groupEnd()
  }, [dispatch])

  // ===== iniState → Redux反映 =====
  useEffect(() => {
    console.group('[AppStateContext] iniState -> Redux effect')

    const apiSettings = iniState?.apiSettings
    const uiSettings = iniState?.appSettings?.ui

    console.log('iniState.apiSettings:', apiSettings)
    console.log('iniState databaseType:', apiSettings?.databaseType)
    console.log(
      'iniState autoSynchronization:',
      apiSettings?.autoSynchronization
    )
    console.log('iniState autoSwitching:', apiSettings?.autoSwitching)
    console.log('redux snapshot:', {
      DATABASE_TYPE: redux.DATABASE_TYPE,
      STAFF_ID: redux.STAFF_ID,
      FACILITY_ID: redux.FACILITY_ID,
      USE_AI: redux.USE_AI,
      DEBUG_FLG: redux.DEBUG_FLG,
      AUTO_SYNCHRONIZATION: redux.AUTO_SYNCHRONIZATION,
      AUTO_SWITCHING: redux.AUTO_SWITCHING,
    })

    if (!apiSettings) {
      console.log('apiSettings がないため return')
      console.groupEnd()
      return
    }

    const updates = {}

    const hasFacilityId = Object.prototype.hasOwnProperty.call(
      apiSettings,
      'facilityId'
    )
    const iniFacilityId = String(apiSettings.facilityId ?? '').trim()
    const reduxFacilityId = String(redux.FACILITY_ID ?? '').trim()

    // 未設定値は空文字に統一する。
    if (hasFacilityId && reduxFacilityId !== iniFacilityId) {
      console.log('[FacilitySync/AppStateProvider] 施設ID差分を検出', {
        rawIniFacilityId: apiSettings.facilityId,
        currentFacilityId: redux.FACILITY_ID,
        nextFacilityId: iniFacilityId,
      })

      updates.FACILITY_ID = iniFacilityId
    }

    const rawDbType = apiSettings.databaseType

    const dbType =
      rawDbType === 'mariadb' || rawDbType === 'MariaDB'
        ? 'mariadb'
        : rawDbType === 'laravel' || rawDbType === 'Laravel'
          ? 'laravel'
        : rawDbType === 'sqlite' || rawDbType === 'SQLite'
          ? 'sqlite'
          : null

    if (dbType && redux.DATABASE_TYPE !== dbType) {
      updates.DATABASE_TYPE = dbType

      console.warn(
        '[AppStateContext] DATABASE_TYPE 差分検出。iniState から Redux を更新予定:',
        {
          reduxDatabaseType: redux.DATABASE_TYPE,
          iniDatabaseType: dbType,
          rawIniDatabaseType: rawDbType,
        }
      )
    }

    if (apiSettings.useAI != null && redux.USE_AI !== apiSettings.useAI) {
      updates.USE_AI = apiSettings.useAI
    }

    if (apiSettings.debugFlg != null) {
      const debugFlg =
        apiSettings.debugFlg === true || apiSettings.debugFlg === 'true'

      if (redux.DEBUG_FLG !== debugFlg) {
        updates.DEBUG_FLG = debugFlg
      }
    }

    const autoSynchronization = toBooleanFlag(
      apiSettings.autoSynchronization,
      true
    )

    if (redux.AUTO_SYNCHRONIZATION !== autoSynchronization) {
      updates.AUTO_SYNCHRONIZATION = autoSynchronization
    }

    const autoSwitching = toBooleanFlag(
      apiSettings.autoSwitching,
      true
    )

    if (redux.AUTO_SWITCHING !== autoSwitching) {
      updates.AUTO_SWITCHING = autoSwitching
    }

    if (uiSettings) {
      const closeButtonsVisible = toBooleanFlag(
        uiSettings.showCloseButtons,
        true
      )

      if (redux.appState.closeButtonsVisible !== closeButtonsVisible) {
        updates.closeButtonsVisible = closeButtonsVisible
      }
    }

    console.log('[AppStateContext] updates:', updates)

    if (Object.keys(updates).length > 0) {
      console.warn(
        '[AppStateContext] iniState から Redux へ dispatch(updateAppStateRedux):',
        updates
      )

      dispatch(updateAppStateRedux(updates))
    } else {
      console.log('[AppStateContext] Redux反映なし')
    }

    console.groupEnd()
  }, [
    iniState?.apiSettings,
    iniState?.appSettings?.ui,
    redux.FACILITY_ID,
    redux.DATABASE_TYPE,
    redux.USE_AI,
    redux.DEBUG_FLG,
    redux.AUTO_SYNCHRONIZATION,
    redux.AUTO_SWITCHING,
    redux.appState.closeButtonsVisible,
    dispatch,
  ])

  // ===== Redux wrappers =====

  // ===== モードスライス =====
  /**
   * 表示モードを変更
   */
  const setAppMode = useCallback(
    (mode) => {
      console.log(
        '[AppStateContext/setAppMode wrapper]',
        mode
      )

      dispatch(setModeRedux(mode))
    },
    [dispatch]
  )

  /**
   * モード内で選択中の項目を変更
   *
   * modeを省略した場合は、現在のモードへ保存する
   */
  const setModeSelectedItem = useCallback(
    (itemId, mode = redux.CURRENT_MODE) => {
      console.log(
        '[AppStateContext/setModeSelectedItem wrapper]',
        {
          mode,
          itemId,
        }
      )

      dispatch(
        setSelectedItemRedux({
          mode,
          itemId,
        })
      )
    },
    [dispatch, redux.CURRENT_MODE]
  )

  /**
   * 指定したモードの選択項目を初期値へ戻す
   *
   * modeを省略した場合は、現在のモードを対象にする
   */
  const resetAppModeSelection = useCallback(
    (mode = redux.CURRENT_MODE) => {
      console.log(
        '[AppStateContext/resetAppModeSelection wrapper]',
        mode
      )

      dispatch(resetModeSelectionRedux(mode))
    },
    [dispatch, redux.CURRENT_MODE]
  )

  /**
   * 表示モードと各モードの選択状態をすべて初期化
   */
  const resetAppModeState = useCallback(() => {
    console.log(
      '[AppStateContext/resetAppModeState wrapper]'
    )

    dispatch(resetModeStateRedux())
  }, [dispatch])

  /**
   * dashboardへ戻す
   */
  const resetAppMode = useCallback(() => {
    console.log(
      '[AppStateContext/resetAppMode wrapper]'
    )

    dispatch(resetModeRedux())
  }, [dispatch])

  /**
   * dashboardを表示
   */
  const showDashboard = useCallback(() => {
    console.log(
      '[AppStateContext/showDashboard]'
    )

    dispatch(
      setModeRedux(APP_MODES.DASHBOARD)
    )
  }, [dispatch])

  /**
   * AI問い合わせを表示
   */
  const showAiInquiry = useCallback(() => {
    console.log(
      '[AppStateContext/showAiInquiry]'
    )

    dispatch(
      setModeRedux(APP_MODES.AI_INQUIRY)
    )
  }, [dispatch])

  // ===== モードスライス　末尾 =====

  const updateAppState = useCallback(
    (updates) => {
      console.log('[AppStateContext/updateAppState wrapper]', updates)
      dispatch(updateAppStateRedux(updates))
    },
    [dispatch]
  )

  const setDatabaseType = useCallback(
    (databaseType) => {
      console.group('[AppStateContext/setDatabaseType wrapper]')
      console.log('databaseType:', databaseType)
      console.log('before redux.DATABASE_TYPE:', redux.DATABASE_TYPE)

      dispatch(setDatabaseTypeRedux(databaseType))

      console.groupEnd()
    },
    [dispatch, redux.DATABASE_TYPE]
  )

  const setUseAI = useCallback(
    (useAI) => {
      console.log('[AppStateContext/setUseAI wrapper]', useAI)
      dispatch(setUseAIRedux(useAI))
    },
    [dispatch]
  )

  const setStaffId = useCallback(
    (staffId) => {
      console.log('[AppStateContext/setStaffId wrapper]', staffId)
      dispatch(setStaffIdRedux(staffId))
    },
    [dispatch]
  )

  const setFacilityId = useCallback(
    (facilityId) => {
      console.log('[AppStateContext/setFacilityId wrapper]', facilityId)
      dispatch(setFacilityIdRedux(facilityId))
    },
    [dispatch]
  )

  const setDebugFlg = useCallback(
    (debugFlg) => {
      console.log('[AppStateContext/setDebugFlg wrapper]', debugFlg)
      dispatch(setDebugFlgRedux(debugFlg))
    },
    [dispatch]
  )

  const setServerConnectionState = useCallback(
    (payload) => {
      console.log('[AppStateContext/setServerConnectionState wrapper]', payload)
      dispatch(setServerConnectionStateRedux(payload))
    },
    [dispatch]
  )

  const setCurrentDate = useCallback(
    (payload) => {
      console.log('[AppStateContext/setCurrentDate wrapper]', payload)
      dispatch(setCurrentDateRedux(payload))
    },
    [dispatch]
  )

  const setCurrentYmd = useCallback(
    (payload) => {
      console.log('[AppStateContext/setCurrentYmd wrapper]', payload)
      dispatch(setCurrentYmdRedux(payload))
    },
    [dispatch]
  )

  const setActiveSpaceId = useCallback(
    (spaceId) => {
      console.log('[AppStateContext/setActiveSpaceId wrapper]', spaceId)
      dispatch(setActiveSpaceIdRedux(spaceId))
    },
    [dispatch]
  )

  const setSpaceChild = useCallback(
    (spaceId, childId, childName) => {
      console.log('[AppStateContext/setSpaceChild wrapper]', {
        spaceId,
        childId,
        childName,
      })

      dispatch(
        setSpaceChildRedux({
          spaceId,
          childId,
          childName,
        })
      )
    },
    [dispatch]
  )

  const setSpacePcName = useCallback(
    (spaceId, pcName) => {
      console.log('[AppStateContext/setSpacePcName wrapper]', {
        spaceId,
        pcName,
      })

      dispatch(
        setSpacePcNameRedux({
          spaceId,
          pcName,
        })
      )
    },
    [dispatch]
  )

  const setSpaceChildColumns = useCallback(
    (spaceId, columns) => {
      console.log('[AppStateContext/setSpaceChildColumns wrapper]', {
        spaceId,
        columns,
      })

      dispatch(
        setSpaceChildColumnsRedux({
          spaceId,
          ...(columns ?? {}),
        })
      )
    },
    [dispatch]
  )

  const clearSpace = useCallback(
    (spaceId) => {
      console.log('[AppStateContext/clearSpace wrapper]', spaceId)
      dispatch(clearSpaceRedux(spaceId))
    },
    [dispatch]
  )

  const resetChilledspace = useCallback(() => {
    console.log('[AppStateContext/resetChilledspace wrapper]')
    dispatch(resetChilledspaceRedux())
  }, [dispatch])

  const setAttendanceData = useCallback(
    (data) => {
      console.log('[AppStateContext/setAttendanceData wrapper]', data)
      dispatch(setAttendanceDataRedux(data))
    },
    [dispatch]
  )

  const setSelectChildFilterMode = useCallback(
    (mode) => {
      console.log('[AppStateContext/setSelectChildFilterMode wrapper]', mode)
      dispatch(setSelectChildFilterModeRedux(mode))
    },
    [dispatch]
  )

  const setIniStateDirect = useCallback((next) => {
    console.group('[AppStateContext/setIniStateDirect]')
    console.log('next:', next)
    console.log('next databaseType:', next?.apiSettings?.databaseType)
    console.log(
      'next autoSynchronization:',
      next?.apiSettings?.autoSynchronization
    )
    console.log('next autoSwitching:', next?.apiSettings?.autoSwitching)
    console.groupEnd()

    setIniState(next)
  }, [])

  // ===== window bridge =====
  useWindowBridge({
    isInitialized,
    appState: redux.appState,
    actions: {
      updateAppState,
      loadIni,
      saveIni,
      updateIniSetting,

      getApiSettings,
      isAutoSynchronizationEnabled,
      isAutoSwitchingEnabled,
      setAutoSynchronization,
      setAutoSwitching,

      // 表示モード操作も window.AppState に公開する
      setAppMode,
      setModeSelectedItem,
      resetAppMode,
      resetAppModeSelection,
      resetAppModeState,
      showDashboard,
      showAiInquiry,

      setDatabaseType,
      setUseAI,
      setStaffId,
      setFacilityId,
      setDebugFlg,
      setServerConnectionState,

      setCurrentDate,
      setCurrentYmd,
      setActiveSpaceId,
      setSpaceChild,
      setSpacePcName,
      setSpaceChildColumns,
      clearSpace,
      resetChilledspace,
      setAttendanceData,
      setActiveSidebarTab,
      setIniState: setIniStateDirect,
    },
  })

  useEffect(() => {
    console.group('[AppStateContext] useWindowBridge actions snapshot')
    console.log('isInitialized:', isInitialized)
    console.log('window.AppState:', window.AppState)
    console.log('window.loadIni exists:', typeof window.loadIni)
    console.log('window.updateAppState exists:', typeof window.updateAppState)
    console.log('window.setDatabaseType exists:', typeof window.setDatabaseType)
    console.log(
      'window.AppState.showAiInquiry exists:',
      typeof window.AppState?.showAiInquiry
    )
    console.log(
      'window.AppState.setModeSelectedItem exists:',
      typeof window.AppState?.setModeSelectedItem
    )
    console.log(
      'window.AppState.isAutoSynchronizationEnabled exists:',
      typeof window.AppState?.isAutoSynchronizationEnabled
    )
    console.log(
      'window.AppState.isAutoSwitchingEnabled exists:',
      typeof window.AppState?.isAutoSwitchingEnabled
    )
    console.groupEnd()
  }, [isInitialized, redux.appState])

  return (
    <AppStateContext.Provider
      value={{
        ...redux,

        isInitialized,
        setIsInitialized,

        iniState,
        loadIni,
        saveIni,
        updateIniSetting,
        setIniState: setIniStateDirect,

        getApiSettings,
        isAutoSynchronizationEnabled,
        isAutoSwitchingEnabled,
        setAutoSynchronization,
        setAutoSwitching,

        isFeatureEnabled,
        getUISettings,
        getWindowSettings,

        updateAppState,
        setDatabaseType,
        setUseAI,
        setStaffId,
        setFacilityId,
        setDebugFlg,
        setServerConnectionState,

        setCurrentDate,
        setCurrentYmd,

        // 児童作業スペース
        setActiveSpaceId,
        setSpaceChild,
        setSpacePcName,
        setSpaceChildColumns,
        clearSpace,
        resetChilledspace,

        setAttendanceData,
        setSelectChildFilterMode,

        // -- モードの追加 --
        setAppMode,
        setModeSelectedItem,
        resetAppMode,
        resetAppModeSelection,
        resetAppModeState,
        showDashboard,
        showAiInquiry,

        activeSidebarTab,
        setActiveSidebarTab,

      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const ctx = useContext(AppStateContext)

  if (!ctx) {
    throw new Error('useAppState must be used within AppStateProvider')
  }

  return ctx
}
