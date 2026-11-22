// AppStateContext/index.jsx

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useMemo,
  useState,
} from 'react'

import {
  useDispatch,
  useSelector,
} from 'react-redux'
import { resolveAiMode, selectCanChooseAiMode } from '@/utils/aiModePolicy'

import {
  useReduxBindings,
} from './useReduxBindings'

import {
  useWindowBridge,
} from './useWindowBridge'

import {
  initializeAppState,
} from './useAppInitializer'

import {
  setAttendanceData as setAttendanceDataRedux,
  setCurrentDate as setCurrentDateRedux,
  setCurrentYmd as setCurrentYmdRedux,
  setDatabaseType as setDatabaseTypeRedux,
  setDebugFlg as setDebugFlgRedux,
  setFacilityId as setFacilityIdRedux,
  setSelectChildFilterMode as setSelectChildFilterModeRedux,
  setServerConnectionState as setServerConnectionStateRedux,
  setStaffId as setStaffIdRedux,
  setUseAI as setUseAIRedux,
  updateAppState as updateAppStateRedux,
} from '@/store/slices/appStateSlice'

import {
  addChilledSpace as addChilledSpaceRedux,
  deleteChilledSpace as deleteChilledSpaceRedux,
  setActiveSpaceId as setActiveSpaceIdRedux,
  setSpaceChild as setSpaceChildRedux,
  setSpacePcName as setSpacePcNameRedux,
  setSpaceChildColumns as setSpaceChildColumnsRedux,
  clearSpace as clearSpaceRedux,
  resetChilledspace as resetChilledspaceRedux,
} from '@/store/slices/chilledspaceSlice'

import {
  setWebAutomationRulesLoading,
  setWebAutomationRules,
  upsertWebAutomationRule,
  setWebAutomationRulesError,
  clearWebAutomationRules as clearWebAutomationRulesRedux,
} from '@/store/slices/webAutomationRuleSlice'

import {
  APP_MODES,
  resetMode as resetModeRedux,
  resetModeSelection as resetModeSelectionRedux,
  resetModeState as resetModeStateRedux,
  setMode as setModeRedux,
  setSelectedItem as setSelectedItemRedux,
} from '@/store/slices/modeSlice'

import {
  loadIni as loadIniFromUtils,
} from '@/utils/config/iniUtils'

import {
  selectAuthenticatedStaffId,
} from '@/store/slices/authSlice'

const AppStateContext =
  createContext(null)

export const FAN_CONTENT_PANELS = {
  AI_SUPPORT: 'ai',
  CHILD_KADAI: 'child-kadai',
  PERSONAL_RECORD: 'personal-record',
}

export function AppStateProvider({
  children,
}) {
  const dispatch = useDispatch()
  const canChooseAi = useSelector(selectCanChooseAiMode)
  const aiAuth = useSelector((state) => state.auth)

  const didInitRef = useRef(false)

  const reduxBindings = useReduxBindings()
  const simpleBoardSpaces = useSelector((state) => state.simpleBoard.spaces)
  const chilledSpaces = useMemo(() => ({
    ...reduxBindings.chilledSpaces,
    ...simpleBoardSpaces,
  }), [reduxBindings.chilledSpaces, simpleBoardSpaces])
  const redux = { ...reduxBindings, chilledSpaces }
  const authenticatedStaffId = useSelector(
    selectAuthenticatedStaffId
  )

  const [
    isInitialized,
    setIsInitialized,
  ] = useState(false)

  const [
    activeSidebarTab,
    setActiveSidebarTab,
  ] = useState('FanContent')

  const [
    iniState,
    setIniState,
  ] = useState({
    appSettings: {},
    userPreferences: {},
    apiSettings: {},
  })

  useEffect(() => {
    const staffId =
      authenticatedStaffId != null
        ? String(authenticatedStaffId)
        : ''

    if (
      redux.STAFF_ID !== staffId
    ) {
      dispatch(
        setStaffIdRedux(
          staffId
        )
      )
    }
  }, [
    authenticatedStaffId,
    dispatch,
    redux.STAFF_ID,
  ])

  // ============================================================
  // 状態監視ログ
  // ============================================================

  useEffect(() => {
    console.group(
      '[AppStateContext] render/state snapshot'
    )

    console.log(
      'isInitialized:',
      isInitialized
    )

    console.log(
      'redux.DATABASE_TYPE:',
      redux.DATABASE_TYPE
    )

    console.log(
      'redux.USE_AI:',
      redux.USE_AI
    )

    console.log(
      'redux.STAFF_ID:',
      redux.STAFF_ID
    )

    console.log(
      'redux.FACILITY_ID:',
      redux.FACILITY_ID
    )

    console.log(
      'redux.DEBUG_FLG:',
      redux.DEBUG_FLG
    )

    console.log(
      'redux.CURRENT_MODE:',
      redux.CURRENT_MODE
    )

    console.log(
      'redux.CURRENT_SELECTED_ITEM_ID:',
      redux.CURRENT_SELECTED_ITEM_ID
    )

    console.log(
      'redux.AI_INQUIRY_SELECTED_ITEM_ID:',
      redux.AI_INQUIRY_SELECTED_ITEM_ID
    )

    console.log(
      'iniState.apiSettings:',
      iniState?.apiSettings
    )

    console.groupEnd()
  }, [
    isInitialized,
    redux.DATABASE_TYPE,
    redux.USE_AI,
    redux.STAFF_ID,
    redux.FACILITY_ID,
    redux.DEBUG_FLG,
    redux.CURRENT_MODE,
    redux.CURRENT_SELECTED_ITEM_ID,
    redux.AI_INQUIRY_SELECTED_ITEM_ID,
    iniState?.apiSettings,
  ])

  // ============================================================
  // ini操作
  // ============================================================

  const loadIni = useCallback(
    async () => {
      console.group(
        '[AppStateContext/loadIni] START'
      )

      try {
        const iniData =
          await loadIniFromUtils()

        console.log(
          '[AppStateContext/loadIni] 読み込んだiniData:',
          iniData
        )

        if (!iniData) {
          console.warn(
            '[AppStateContext/loadIni] iniDataがnull/undefined'
          )

          return null
        }

        const nextIniState = {
          appSettings:
            iniData.appSettings ?? {},

          userPreferences:
            iniData.userPreferences ?? {},

          apiSettings:
            iniData.apiSettings ?? {},
        }

        setIniState(
          nextIniState
        )

        return iniData
      } catch (error) {
        console.error(
          '[AppStateContext/loadIni] エラー:',
          error
        )

        return null
      } finally {
        console.groupEnd()
      }
    },
    []
  )

  const saveIni = useCallback(
    async (override) => {
      console.group(
        '[AppStateContext/saveIni] START'
      )

      try {
        const source =
          override ?? iniState

        const result =
          await window.electronAPI.saveIni({
            version:
              '1.0.0',

            appSettings:
              source.appSettings ?? {},

            userPreferences:
              source.userPreferences ?? {},

            apiSettings:
              source.apiSettings ?? {},
          })

        console.log(
          '[AppStateContext/saveIni] 保存結果:',
          result
        )

        return result
      } catch (error) {
        console.error(
          '[AppStateContext/saveIni] エラー:',
          error
        )

        return false
      } finally {
        console.groupEnd()
      }
    },
    [
      iniState,
    ]
  )

  const updateIniSetting = useCallback(
    async (
      path,
      value
    ) => {
      console.group(
        '[AppStateContext/updateIniSetting] START'
      )

      console.log(
        'path:',
        path
      )

      console.log(
        'value:',
        value
      )

      try {
        const result =
          await window.electronAPI.updateIniSetting(
            path,
            value
          )

        setIniState(
          (previous) => {
            const next =
              structuredClone(
                previous
              )

            const keys =
              path.split('.')

            let current = next

            for (
              let index = 0;
              index < keys.length - 1;
              index += 1
            ) {
              const key =
                keys[index]

              if (!current[key]) {
                current[key] = {}
              }

              current =
                current[key]
            }

            current[
              keys.at(-1)
            ] = value

            return next
          }
        )

        return result
      } catch (error) {
        console.error(
          '[AppStateContext/updateIniSetting] エラー:',
          error
        )

        return null
      } finally {
        console.groupEnd()
      }
    },
    []
  )

  const isFeatureEnabled = useCallback(
    (name) =>
      iniState
        .appSettings
        .features?.[name]
        ?.enabled ?? false,
    [
      iniState,
    ]
  )

  const getUISettings = useCallback(
    () =>
      iniState.appSettings.ui,
    [
      iniState,
    ]
  )

  const getWindowSettings = useCallback(
    () =>
      iniState.appSettings.window,
    [
      iniState,
    ]
  )

  const getApiSettings = useCallback(
    () =>
      iniState.apiSettings ?? {},
    [
      iniState,
    ]
  )

  // ============================================================
  // 初期化
  // ============================================================

  useEffect(() => {
    if (didInitRef.current) {
      return
    }

    didInitRef.current = true

    const init = async () => {
      try {
        const {
          ini,
        } = await initializeAppState({
          dispatch,
          setIsInitialized,
        })

        const iniData =
          ini ??
          (
            await loadIniFromUtils()
          )

        if (iniData) {
          setIniState({
            appSettings:
              iniData.appSettings ?? {},

            userPreferences:
              iniData.userPreferences ?? {},

            apiSettings:
              iniData.apiSettings ?? {},
          })
        }
      } catch (error) {
        console.error(
          '[AppStateContext/init] エラー:',
          error
        )
      }
    }

    init()
  }, [
    dispatch,
  ])

  // ============================================================
  // iniStateからReduxへ反映
  // ============================================================

  useEffect(() => {
    const apiSettings =
      iniState?.apiSettings

    if (!apiSettings) {
      return
    }

    const updates = {}

    const hasFacilityId =
      Object.prototype.hasOwnProperty.call(
        apiSettings,
        'facilityId'
      )
    const iniFacilityId = String(
      apiSettings.facilityId ?? ''
    ).trim()
    const reduxFacilityId = String(
      redux.FACILITY_ID ?? ''
    ).trim()

    // 未設定値は空文字に統一する。
    if (
      hasFacilityId &&
      reduxFacilityId !== iniFacilityId
    ) {
      console.log(
        '[FacilitySync/AppStateProvider] 施設ID差分を検出',
        {
          rawIniFacilityId:
            apiSettings.facilityId,
          currentFacilityId:
            redux.FACILITY_ID,
          nextFacilityId:
            iniFacilityId,
        }
      )

      updates.FACILITY_ID =
        iniFacilityId
    }

    const dbType = 'laravel'

    if (
      dbType &&
      redux.DATABASE_TYPE !== dbType
    ) {
      updates.DATABASE_TYPE =
        dbType
    }

    const effectiveAiMode = resolveAiMode(aiAuth, apiSettings.useAI)
    if (redux.USE_AI !== effectiveAiMode) {
      updates.USE_AI = effectiveAiMode
    }

    if (
      apiSettings.debugFlg != null
    ) {
      const debugFlg =
        apiSettings.debugFlg === true ||
        apiSettings.debugFlg === 'true'

      if (
        redux.DEBUG_FLG !== debugFlg
      ) {
        updates.DEBUG_FLG =
          debugFlg
      }
    }

    if (
      Object.keys(updates).length > 0
    ) {
      dispatch(
        updateAppStateRedux(
          updates
        )
      )
    }
  }, [
    iniState?.apiSettings,
    redux.FACILITY_ID,
    redux.DATABASE_TYPE,
    redux.USE_AI,
    redux.DEBUG_FLG,
    aiAuth,
    dispatch,
  ])

  // Once authenticated as a manager, recover the saved preference that was
  // masked during unauthenticated startup. Other users always remain forced.
  useEffect(() => {
    if (canChooseAi) void loadIni()
  }, [canChooseAi, loadIni])

  // ============================================================
  // modeSlice wrappers
  // ============================================================

  /**
   * アプリケーションモードを変更
   */
  const setAppMode = useCallback(
    (mode) => {
      dispatch(
        setModeRedux(
          mode
        )
      )
    },
    [
      dispatch,
    ]
  )

  /**
   * 現在のモード内で表示する画面を変更
   *
   * modeを省略した場合は、
   * modeSlice側で現在のモードが使用される
   */
  const setModeSelectedItem = useCallback(
    (
      itemId,
      mode
    ) => {
      dispatch(
        setSelectedItemRedux({
          itemId,
          mode,
        })
      )
    },
    [
      dispatch,
    ]
  )

  /**
   * AI問い合わせ内の画面を変更
   */
  const setAiInquiryScreen = useCallback(
    (screen) => {
      dispatch(
        setSelectedItemRedux({
          mode:
            APP_MODES.AI_INQUIRY,

          itemId:
            screen,
        })
      )
    },
    [
      dispatch,
    ]
  )

  /**
   * dashboard内の画面を変更
   */
  const setDashboardScreen = useCallback(
    (screen) => {
      dispatch(
        setSelectedItemRedux({
          mode:
            APP_MODES.DASHBOARD,

          itemId:
            screen,
        })
      )
    },
    [
      dispatch,
    ]
  )

  /**
   * dashboardモードへ戻す
   *
   * 各モードの選択画面は維持
   */
  const resetAppMode = useCallback(
    () => {
      dispatch(
        resetModeRedux()
      )
    },
    [
      dispatch,
    ]
  )

  /**
   * 指定したモードの選択画面を初期化
   *
   * modeを省略した場合は現在のモードを初期化
   */
  const resetAppModeSelection =
    useCallback(
      (mode) => {
        dispatch(
          resetModeSelectionRedux(
            mode
          )
        )
      },
      [
        dispatch,
      ]
    )

  /**
   * modeSliceをすべて初期化
   */
  const resetAppModeState =
    useCallback(
      () => {
        dispatch(
          resetModeStateRedux()
        )
      },
      [
        dispatch,
      ]
    )

  /**
   * dashboardを表示
   */
  const showDashboard = useCallback(
    () => {
      dispatch(
        setModeRedux(
          APP_MODES.DASHBOARD
        )
      )
    },
    [
      dispatch,
    ]
  )

  /**
   * AI問い合わせを表示
   *
   * 前回AI問い合わせ内で選択していた画面を復元
   */
  const showAiInquiry = useCallback(
    () => {
      dispatch(
        setModeRedux(
          APP_MODES.AI_INQUIRY
        )
      )
    },
    [
      dispatch,
    ]
  )

  /**
   * AI問い合わせの指定画面を表示
   */
  const showAiInquiryScreen =
    useCallback(
      (screen) => {
        dispatch(
          setModeRedux(
            APP_MODES.AI_INQUIRY
          )
        )

        dispatch(
          setSelectedItemRedux({
            mode:
              APP_MODES.AI_INQUIRY,

            itemId:
              screen,
          })
        )
      },
      [
        dispatch,
      ]
    )

  // ============================================================
  // appStateSlice wrappers
  // ============================================================

  const updateAppState = useCallback(
    (updates) => {
      dispatch(
        updateAppStateRedux(
          updates
        )
      )
    },
    [
      dispatch,
    ]
  )

  const setDatabaseType = useCallback(
    (databaseType) => {
      dispatch(
        setDatabaseTypeRedux(
          databaseType
        )
      )
    },
    [
      dispatch,
    ]
  )

  const setUseAI = useCallback(
    (useAI) => {
      dispatch(
        setUseAIRedux(
          useAI
        )
      )
    },
    [
      dispatch,
    ]
  )

  const setStaffId = useCallback(
    (staffId) => {
      dispatch(
        setStaffIdRedux(
          staffId
        )
      )
    },
    [
      dispatch,
    ]
  )

  const setFacilityId = useCallback(
    (facilityId) => {
      dispatch(
        setFacilityIdRedux(
          facilityId
        )
      )
    },
    [
      dispatch,
    ]
  )

  const setDebugFlg = useCallback(
    (debugFlg) => {
      dispatch(
        setDebugFlgRedux(
          debugFlg
        )
      )
    },
    [
      dispatch,
    ]
  )

  const setServerConnectionState =
    useCallback(
      (payload) => {
        dispatch(
          setServerConnectionStateRedux(
            payload
          )
        )
      },
      [
        dispatch,
      ]
    )

  const setCurrentDate = useCallback(
    (payload) => {
      dispatch(
        setCurrentDateRedux(
          payload
        )
      )
    },
    [
      dispatch,
    ]
  )

  const setCurrentYmd = useCallback(
    (payload) => {
      dispatch(
        setCurrentYmdRedux(
          payload
        )
      )
    },
    [
      dispatch,
    ]
  )

  // ============================================================
  // 児童作業スペース
  // ============================================================

  const setActiveSpaceId = useCallback(
    (spaceId) => {
      dispatch(setActiveSpaceIdRedux(spaceId))
    },
    [dispatch]
  )

  const addChilledSpace = useCallback(() => {
    dispatch(addChilledSpaceRedux())
  }, [dispatch])

  const deleteChilledSpace = useCallback(
    (spaceId) => {
      dispatch(deleteChilledSpaceRedux(spaceId))
    },
    [dispatch]
  )

  const setSpaceChild = useCallback(
    (spaceId, childId, childName) => {
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
      dispatch(clearSpaceRedux(spaceId))
    },
    [dispatch]
  )

  const resetChilledspace = useCallback(() => {
    dispatch(resetChilledspaceRedux())
  }, [dispatch])

  const setAttendanceData =
    useCallback(
      (data) => {
        dispatch(
          setAttendanceDataRedux(
            data
          )
        )
      },
      [
        dispatch,
      ]
    )

  const setSelectChildFilterMode =
    useCallback(
      (mode) => {
        dispatch(
          setSelectChildFilterModeRedux(
            mode
          )
        )
      },
      [
        dispatch,
      ]
    )

  // ============================================================
  // web_automation_rules
  // ============================================================

  const loadWebAutomationRules = useCallback(
    async ({ category } = {}) => {
      console.group('[AppStateContext/loadWebAutomationRules]')
      console.log('category:', category)

      dispatch(setWebAutomationRulesLoading(true))

      try {
        const api =
          window.electronAPI?.laravel_webAutomationRules_getAll

        if (typeof api !== 'function') {
          throw new Error(
            'preload に laravel_webAutomationRules_getAll が公開されていません'
          )
        }

        const params = {}

        if (category) {
          params.category = category
        }

        const result = await api(params)

        if (result?.success === false) {
          throw new Error(
            result?.message ??
              result?.error ??
              'web_automation_rules の取得に失敗しました'
          )
        }

        const items = Array.isArray(result?.data)
          ? result.data
          : []

        dispatch(
          setWebAutomationRules({
            items,
            meta: result?.meta ?? {},
          })
        )

        return {
          success: true,
          data: items,
          meta: result?.meta ?? {},
        }
      } catch (error) {
        console.error(
          '[AppStateContext/loadWebAutomationRules] エラー:',
          error
        )

        dispatch(
          setWebAutomationRulesError(
            error?.message ?? String(error)
          )
        )

        return {
          success: false,
          data: [],
          meta: {},
          error: error?.message ?? String(error),
        }
      } finally {
        console.groupEnd()
      }
    },
    [dispatch]
  )

  const loadWebAutomationRule = useCallback(
    async (ruleKey, { force = false } = {}) => {
      const normalizedRuleKey =
        ruleKey != null ? String(ruleKey).trim() : ''

      if (!normalizedRuleKey) {
        return {
          success: false,
          data: null,
          error: 'ruleKey が空です',
        }
      }

      if (!force) {
        const cached =
          redux.webAutomationRulesByKey?.[normalizedRuleKey]

        if (cached) {
          return {
            success: true,
            data: cached,
            cached: true,
          }
        }
      }

      dispatch(setWebAutomationRulesLoading(true))

      try {
        const api =
          window.electronAPI?.laravel_webAutomationRule_get

        if (typeof api !== 'function') {
          throw new Error(
            'preload に laravel_webAutomationRule_get が公開されていません'
          )
        }

        const result = await api(normalizedRuleKey)

        if (result?.success === false) {
          throw new Error(
            result?.message ??
              result?.error ??
              `自動化ルール ${normalizedRuleKey} の取得に失敗しました`
          )
        }

        const rule = result?.data ?? null

        if (!rule?.rule_key) {
          throw new Error(
            `自動化ルール ${normalizedRuleKey} のデータが不正です`
          )
        }

        dispatch(upsertWebAutomationRule(rule))

        return {
          success: true,
          data: rule,
          cached: false,
        }
      } catch (error) {
        console.error(
          '[AppStateContext/loadWebAutomationRule] エラー:',
          error
        )

        dispatch(
          setWebAutomationRulesError(
            error?.message ?? String(error)
          )
        )

        return {
          success: false,
          data: null,
          error: error?.message ?? String(error),
        }
      }
    },
    [dispatch, redux.webAutomationRulesByKey]
  )

  const getWebAutomationRule = useCallback(
    (ruleKey) => {
      if (ruleKey == null) {
        return null
      }

      return (
        redux.webAutomationRulesByKey?.[String(ruleKey)] ?? null
      )
    },
    [redux.webAutomationRulesByKey]
  )

  const clearWebAutomationRules = useCallback(() => {
    dispatch(clearWebAutomationRulesRedux())
  }, [dispatch])

  const setIniStateDirect = useCallback(
    (next) => {
      setIniState(
        next
      )
    },
    []
  )

  // ============================================================
  // window bridge
  // ============================================================

  useWindowBridge({
    isInitialized,

    appState: {
      ...redux.appState,
      // 児童選択の正本は chilledspace。window.AppState には互換値を公開する。
      ACTIVE_CHILLEDSPACE_ID: redux.activeSpaceId,
      CHILLEDSPACES: redux.chilledSpaces,
    },

    actions: {
      updateAppState,

      loadIni,
      saveIni,
      updateIniSetting,

      getApiSettings,

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
      addChilledSpace,
      deleteChilledSpace,
      setSpaceChild,
      setSpacePcName,
      setSpaceChildColumns,
      clearSpace,
      resetChilledspace,

      setAttendanceData,

      // Web自動化ルール
      loadWebAutomationRules,
      loadWebAutomationRule,
      getWebAutomationRule,
      clearWebAutomationRules,

      setActiveSidebarTab,

      setIniState:
        setIniStateDirect,

      // modeSlice
      setAppMode,
      setModeSelectedItem,
      setAiInquiryScreen,
      setDashboardScreen,
      resetAppMode,
      resetAppModeSelection,
      resetAppModeState,
      showDashboard,
      showAiInquiry,
      showAiInquiryScreen,
    },
  })

  return (
    <AppStateContext.Provider
      value={{
        ...redux,

        // 現在選択されている施設ID。
        // 既存のFACILITY_IDも後方互換のためそのまま公開する。
        SELECT_FACILITY_ID:
          redux.FACILITY_ID,

        isInitialized,
        setIsInitialized,

        iniState,
        loadIni,
        saveIni,
        updateIniSetting,

        setIniState:
          setIniStateDirect,

        getApiSettings,

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
        addChilledSpace,
        deleteChilledSpace,
        setSpaceChild,
        setSpacePcName,
        setSpaceChildColumns,
        clearSpace,
        resetChilledspace,

        setAttendanceData,

        setSelectChildFilterMode,

        // Web自動化ルール
        loadWebAutomationRules,
        loadWebAutomationRule,
        getWebAutomationRule,
        clearWebAutomationRules,

        // modeSlice
        setAppMode,
        setModeSelectedItem,
        setAiInquiryScreen,
        setDashboardScreen,
        resetAppMode,
        resetAppModeSelection,
        resetAppModeState,
        showDashboard,
        showAiInquiry,
        showAiInquiryScreen,

        activeSidebarTab,
        setActiveSidebarTab,
      }}
    >
      {children}
    </AppStateContext.Provider>
  )
}

export function useAppState() {
  const context =
    useContext(
      AppStateContext
    )

  if (!context) {
    throw new Error(
      'useAppState must be used within AppStateProvider'
    )
  }

  return context
}
