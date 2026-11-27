// AppStateContext/useReduxBindings/index.js

import {
  useCallback,
  useMemo,
} from 'react'

import {
  shallowEqual,
  useSelector,
} from 'react-redux'

import * as s from '@/store/slices/appStateSlice'

import {
  selectChildren,
  selectCompanies,
  selectRoles,
  selectCompanyRoles,
  selectStaffCompanyRoles,
  selectChildrenType,
  selectDatabaseError,
  selectDatabaseLoading,
  selectDatabaseMetadata,
  selectDatabaseState,
  selectDayOfWeek,
  selectFacilityChildren,
  selectFacilityStaff,
  selectFacilitys,
  selectManagers2,
  selectMemo,
  selectMServiceItems,
  selectPc,
  selectPcToChildren,
  selectPronunciation,
  selectRecordTypes,
  selectRefreshTokens,
  selectServiceRecord,
  selectStaffFacilityRoles,
  selectStaffs,
  selectTempNotes,
  selectUsers,
} from '@/store/slices/databaseSlice'

import {
  selectCurrentStaffCompanies,
  selectCurrentCompanyRole,
  selectCanManageCompanyStaff,
  selectAssignableCompanyRoles,
  selectCanAccessFacility,
} from '@/store/roleSelectors'

import {
  selectAuthenticatedRoleCode,
  selectIsCompanyAutomationEnabled,
} from '@/store/slices/authSlice'

import {
  selectActiveSpaceId,
  selectSpaces,
} from '@/store/slices/chilledspaceSlice'

import {
  selectWebAutomationRuleState,
  selectWebAutomationRules,
  selectWebAutomationRulesByKey,
  selectWebAutomationRulesMeta,
  selectWebAutomationRulesLoading,
  selectWebAutomationRulesError,
  selectWebAutomationRulesLoadedAt,
} from '@/store/slices/webAutomationRuleSlice'

import {
  selectAiInquirySelectedItemId,
  selectCurrentMode,
  selectCurrentSelectedItemId,
  selectDashboardSelectedItemId,
  selectIsAiInquiryMode,
  selectIsDashboardMode,
} from '@/store/slices/modeSlice'

import {
  splitChildrenData,
} from '@/AppStateContext/splitChildrenData'

export function useReduxBindings() {
  // ============================================================
  // appStateSlice
  // ============================================================

  const appState = useSelector(
    s.selectAppState,
    shallowEqual
  )

  // ============================================================
  // databaseSlice
  // ============================================================

  const databaseState = useSelector(
    selectDatabaseState,
    shallowEqual
  )

  // ============================================================
  // 基本マスタ
  // ============================================================

  const dbChildren = useSelector(
    selectChildren,
    shallowEqual
  )

  const dbChildrenType = useSelector(
    selectChildrenType,
    shallowEqual
  )

  const dbPronunciation = useSelector(
    selectPronunciation,
    shallowEqual
  )

  const dbStaffs = useSelector(
    selectStaffs,
    shallowEqual
  )

  const dbCompanies = useSelector(selectCompanies, shallowEqual)
  const dbRoles = useSelector(selectRoles, shallowEqual)
  const dbCompanyRoles = useSelector(selectCompanyRoles, shallowEqual)
  const dbStaffCompanyRoles = useSelector(selectStaffCompanyRoles, shallowEqual)

  // ログイン情報を権限の正本にする。旧role_idからは推測しない。
  const authRoleCode = useSelector(selectAuthenticatedRoleCode)
  const isCompanyAutomationEnabled = useSelector(selectIsCompanyAutomationEnabled)
  const currentStaffCompanies = useSelector(selectCurrentStaffCompanies, shallowEqual)
  const currentCompanyId = useSelector((state) => {
    const selectedFacilityId = s.selectFacilityId(state)
    const facility = selectFacilitys(state).find(
      (item) => String(item.id) === String(selectedFacilityId)
    )
    const companyId = facility?.company_id
    return companyId == null ? null : companyId
  })
  const currentCompanyRole = useSelector((state) =>
    selectCurrentCompanyRole(state, currentCompanyId)
  )
  const canManageCurrentCompanyStaff = useSelector((state) =>
    selectCanManageCompanyStaff(state, currentCompanyId)
  )
  const assignableCurrentCompanyRoles = useSelector((state) =>
    selectAssignableCompanyRoles(state, currentCompanyId), shallowEqual
  )
  const canAccessCurrentFacility = useSelector((state) =>
    selectCanAccessFacility(state, s.selectFacilityId(state))
  )

  const dbFacilitys = useSelector(
    selectFacilitys,
    shallowEqual
  )

  // ============================================================
  // 関連テーブル
  // ============================================================

  const dbFacilityChildren = useSelector(
    selectFacilityChildren,
    shallowEqual
  )

  const dbFacilityStaff = useSelector(
    selectFacilityStaff,
    shallowEqual
  )

  const dbManagers2 = useSelector(
    selectManagers2,
    shallowEqual
  )

  const dbPc = useSelector(
    selectPc,
    shallowEqual
  )

  const dbPcToChildren = useSelector(
    selectPcToChildren,
    shallowEqual
  )

  const dbDayOfWeek = useSelector(
    selectDayOfWeek,
    shallowEqual
  )

  // ============================================================
  // 記録系
  // ============================================================

  const dbServiceRecord = useSelector(
    selectServiceRecord,
    shallowEqual
  )

  const dbRecordTypes = useSelector(
    selectRecordTypes,
    shallowEqual
  )

  const dbMServiceItems = useSelector(
    selectMServiceItems,
    shallowEqual
  )

  // ============================================================
  // メモ・テキスト系
  // ============================================================

  const dbTempNotes = useSelector(
    selectTempNotes,
    shallowEqual
  )

  const dbMemo = useSelector(
    selectMemo,
    shallowEqual
  )

  const dbStaffFacilityRoles = useSelector(
    selectStaffFacilityRoles,
    shallowEqual
  )

  // ============================================================
  // 認証系
  // ============================================================

  const dbUsers = useSelector(
    selectUsers,
    shallowEqual
  )

  const dbRefreshTokens = useSelector(
    selectRefreshTokens,
    shallowEqual
  )

  // ============================================================
  // database状態
  // ============================================================

  const databaseLoading = useSelector(
    selectDatabaseLoading
  )

  const databaseError = useSelector(
    selectDatabaseError
  )

  const databaseMetadata = useSelector(
    selectDatabaseMetadata,
    shallowEqual
  )

  // ============================================================
  // primitives
  // ============================================================

  const HUG_USERNAME = useSelector(
    s.selectHugUsername
  )

  const HUG_PASSWORD = useSelector(
    s.selectHugPassword
  )

  // Gemini
  const GEMINI_API_KEY = useSelector(
    s.selectGeminiApiKey
  )

  const GEMINI_MODEL = useSelector(
    s.selectGeminiModel
  )

  // OpenRouter
  const OPEN_ROUTER_API_KEY = useSelector(
    s.selectOpenRouterApiKey
  )

  const OPEN_ROUTER_MODEL = useSelector(
    s.selectOpenRouterModel
  )

  // DeepSeek
  const DEEPSEEK_MAIL = useSelector(
    s.selectDeepSeekMail
  )

  const DEEPSEEK_PASSWORD = useSelector(
    s.selectDeepSeekPassword
  )

  // ChatGPT
  const OPENAI_MAIL = useSelector(
    s.selectOpenaiMail
  )

  const OPENAI_PASSWORD = useSelector(
    s.selectOpenaiPassword
  )

  // Ollama
  const OLLAMA_URL = useSelector(
    s.selectOllamaUrl
  )

  const OLLAMA_MODEL = useSelector(
    s.selectOllamaModel
  )

  const USE_AI = useSelector(
    s.selectUseAI
  )

  const DATABASE_TYPE = useSelector(
    s.selectDatabaseType
  )

  const STAFF_ID = useSelector(
    s.selectStaffId
  )

  const FACILITY_ID = useSelector(
    s.selectFacilityId
  )

  // ============================================================
  // chilledspaceSlice
  // 児童選択状態の正本。旧 SELECT_* はアクティブ枠の互換値として返す。
  // ============================================================

  const activeSpaceId = useSelector(
    selectActiveSpaceId
  )

  const chilledSpaces = useSelector(
    selectSpaces,
    shallowEqual
  )

  // ============================================================
  // webAutomationRuleSlice
  // ============================================================

  const webAutomationRuleState = useSelector(
    selectWebAutomationRuleState,
    shallowEqual
  )

  const webAutomationRules = useSelector(
    selectWebAutomationRules,
    shallowEqual
  )

  const webAutomationRulesByKey = useSelector(
    selectWebAutomationRulesByKey,
    shallowEqual
  )

  const webAutomationRulesMeta = useSelector(
    selectWebAutomationRulesMeta,
    shallowEqual
  )

  const webAutomationRulesLoading = useSelector(
    selectWebAutomationRulesLoading
  )

  const webAutomationRulesError = useSelector(
    selectWebAutomationRulesError
  )

  const webAutomationRulesLoadedAt = useSelector(
    selectWebAutomationRulesLoadedAt
  )

  // ============================================================
  // 日付・曜日
  // ============================================================

  const CURRENT_DAY_OF_WEEK = useSelector(
    s.selectCurrentDate,
    shallowEqual
  )

  const CURRENT_YMD = useSelector(
    s.selectCurrentYmd
  )

  // ============================================================
  // その他
  // ============================================================

  const PROMPTS = useSelector(
    s.selectPrompts
  )

  const attendanceData = useSelector(
    s.selectAttendanceData
  )

  const DEBUG_FLG = useSelector(
    s.selectDebugFlg
  )

  const SELECT_CHILD_FILTER_MODE = useSelector(
    s.selectSelectChildFilterMode
  )

  // ============================================================
  // modeSlice
  // ============================================================

  /**
   * 現在のアプリケーションモード
   *
   * dashboard
   * aiInquiry
   */
  const CURRENT_MODE = useSelector(
    selectCurrentMode
  )

  /**
   * 現在のモードで選択されている画面
   */
  const CURRENT_SELECTED_ITEM_ID = useSelector(
    selectCurrentSelectedItemId
  )

  /**
   * dashboardモードで選択されている画面
   */
  const DASHBOARD_SELECTED_ITEM_ID = useSelector(
    selectDashboardSelectedItemId
  )

  /**
   * aiInquiryモードで選択されている画面
   *
   * dashboard
   * aiRecordEditer
   * chat
   * personalRecord
   * healthAnalysis
   */
  const AI_INQUIRY_SELECTED_ITEM_ID = useSelector(
    selectAiInquirySelectedItemId
  )

  const IS_DASHBOARD_MODE = useSelector(
    selectIsDashboardMode
  )

  const IS_AI_INQUIRY_MODE = useSelector(
    selectIsAiInquiryMode
  )

  // ============================================================
  // databaseSliceを抽出用tablesへまとめる
  // ============================================================

  const databaseTables = useMemo(
    () => ({
      // 基本マスタ
      children: dbChildren,
      children_type: dbChildrenType,
      pronunciation: dbPronunciation,
      staffs: dbStaffs,
      facilitys: dbFacilitys,
      companies: dbCompanies,
      roles: dbRoles,
      company_roles: dbCompanyRoles,
      company_staff: dbStaffCompanyRoles,

      // 関連テーブル
      facility_children:
        dbFacilityChildren,

      facility_staff:
        dbFacilityStaff,

      managers2:
        dbManagers2,

      pc:
        dbPc,

      pc_to_children:
        dbPcToChildren,

      day_of_week:
        dbDayOfWeek,

      // 記録系
      service_record:
        dbServiceRecord,

      record_types:
        dbRecordTypes,

      m_service_items:
        dbMServiceItems,

      // メモ・テキスト系
      temp_notes:
        dbTempNotes,

      memo:
        dbMemo,

      staff_facility_roles:
        dbStaffFacilityRoles,

      // 認証系
      users:
        dbUsers,

      refresh_tokens:
        dbRefreshTokens,
    }),
    [
      dbChildren,
      dbChildrenType,
      dbPronunciation,
      dbStaffs,
      dbFacilitys,
      dbCompanies,
      dbRoles,
      dbCompanyRoles,
      dbStaffCompanyRoles,
      dbFacilityChildren,
      dbFacilityStaff,
      dbManagers2,
      dbPc,
      dbPcToChildren,
      dbDayOfWeek,
      dbServiceRecord,
      dbRecordTypes,
      dbMServiceItems,
      dbTempNotes,
      dbMemo,
      dbStaffFacilityRoles,
      dbUsers,
      dbRefreshTokens,
    ]
  )

  // ============================================================
  // databaseSliceから児童データを抽出
  // ============================================================

  const getChildrenDataByDay = useCallback(
    async ({
      staffId = STAFF_ID,
      weekdayId,
      facilityId = FACILITY_ID,
    } = {}) => {
      const resolvedWeekdayId =
        weekdayId ??
        CURRENT_DAY_OF_WEEK?.weekdayId ??
        CURRENT_DAY_OF_WEEK?.id ??
        CURRENT_DAY_OF_WEEK?.weekday_id ??
        CURRENT_DAY_OF_WEEK

      console.groupCollapsed(
        '[useReduxBindings/getChildrenDataByDay] START'
      )

      void 0

      void 0

      void 0

      void 0

      void 0

      void 0

      void 0

      void 0

      if (!staffId) {
        console.warn(
          '[useReduxBindings/getChildrenDataByDay] staffId が空です'
        )

        console.groupEnd()

        return {
          week_children: [],
          waiting_children: [],
          Experience_children: [],
        }
      }

      if (!resolvedWeekdayId) {
        console.warn(
          '[useReduxBindings/getChildrenDataByDay] weekdayId が空です'
        )

        console.groupEnd()

        return {
          week_children: [],
          waiting_children: [],
          Experience_children: [],
        }
      }

      try {
        const result =
          await splitChildrenData({
            tables:
              databaseTables,

            staffId,

            weekdayId:
              resolvedWeekdayId,

            facility_id:
              facilityId,
          })

        void 0

        return {
          week_children:
            Array.isArray(
              result?.week_children
            )
              ? result.week_children
              : [],

          waiting_children:
            Array.isArray(
              result?.waiting_children
            )
              ? result.waiting_children
              : [],

          Experience_children:
            Array.isArray(
              result?.Experience_children
            )
              ? result.Experience_children
              : [],
        }
      } catch (error) {
        console.error(
          '[useReduxBindings/getChildrenDataByDay] エラー:',
          error
        )

        return {
          week_children: [],
          waiting_children: [],
          Experience_children: [],
        }
      } finally {
        console.groupEnd()
      }
    },
    [
      STAFF_ID,
      FACILITY_ID,
      CURRENT_DAY_OF_WEEK,
      databaseTables,
      databaseLoading,
      databaseError,
      databaseMetadata,
    ]
  )

  return {
    appState,

    // ==========================================================
    // databaseSlice
    // ==========================================================

    databaseState,
    databaseTables,

    // 基本マスタ
    dbChildren,
    dbChildrenType,
    dbPronunciation,
    dbStaffs,
    dbFacilitys,
    dbCompanies,
    dbRoles,
    dbCompanyRoles,
    dbStaffCompanyRoles,

    // 現在の認証・選択施設を基準に計算した表示用権限
    authRoleCode,
    isCompanyAutomationEnabled,
    currentStaffCompanies,
    currentCompanyId,
    currentCompanyRole,
    canManageCurrentCompanyStaff,
    assignableCurrentCompanyRoles,
    canAccessCurrentFacility,

    // 関連テーブル
    dbFacilityChildren,
    dbFacilityStaff,
    dbManagers2,
    dbPc,
    dbPcToChildren,
    dbDayOfWeek,

    // 記録系
    dbServiceRecord,
    dbRecordTypes,
    dbMServiceItems,

    // メモ・テキスト系
    dbTempNotes,
    dbMemo,
    dbStaffFacilityRoles,

    // 認証系
    dbUsers,
    dbRefreshTokens,

    // database状態
    databaseLoading,
    databaseError,
    databaseMetadata,

    getChildrenDataByDay,

    // ==========================================================
    // appStateSlice
    // ==========================================================

    HUG_USERNAME,
    HUG_PASSWORD,

    GEMINI_API_KEY,
    GEMINI_MODEL,

    OPEN_ROUTER_API_KEY,
    OPEN_ROUTER_MODEL,

    DEEPSEEK_MAIL,
    DEEPSEEK_PASSWORD,

    OPENAI_MAIL,
    OPENAI_PASSWORD,

    OLLAMA_URL,
    OLLAMA_MODEL,

    USE_AI,
    DATABASE_TYPE,

    STAFF_ID,
    FACILITY_ID,

    activeSpaceId,
    chilledSpaces,

    webAutomationRuleState,
    webAutomationRules,
    webAutomationRulesByKey,
    webAutomationRulesMeta,
    webAutomationRulesLoading,
    webAutomationRulesError,
    webAutomationRulesLoadedAt,

    // 旧コード向け互換値。実体は activeSpace から取得する。

    CURRENT_DAY_OF_WEEK,
    CURRENT_YMD,

    PROMPTS,
    attendanceData,
    DEBUG_FLG,
    SELECT_CHILD_FILTER_MODE,

    // ==========================================================
    // modeSlice
    // ==========================================================

    CURRENT_MODE,

    CURRENT_SELECTED_ITEM_ID,

    DASHBOARD_SELECTED_ITEM_ID,

    AI_INQUIRY_SELECTED_ITEM_ID,

    IS_DASHBOARD_MODE,

    IS_AI_INQUIRY_MODE,
  }
}
