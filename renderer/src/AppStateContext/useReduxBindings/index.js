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
  selectChildrenType,
  selectChildRecords,
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
  selectTextData,
  selectToolbox,
  selectUsers,
} from '@/store/slices/databaseSlice'

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

  /**
   * appState全体
   *
   * Slice全体が必要な場所でのみ使用します。
   */
  const appState = useSelector(
    s.selectAppState,
    shallowEqual
  )

  // ============================================================
  // databaseSlice
  // ============================================================

  /**
   * databaseSlice全体
   */
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

  const dbChildRecords = useSelector(
    selectChildRecords,
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

  const dbTextData = useSelector(
    selectTextData,
    shallowEqual
  )

  const dbToolbox = useSelector(
    selectToolbox,
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
  // appStateSliceの基本設定
  // ============================================================

  const HUG_USERNAME = useSelector(
    s.selectHugUsername
  )

  const HUG_PASSWORD = useSelector(
    s.selectHugPassword
  )

  // ============================================================
  // Gemini
  // ============================================================

  const GEMINI_API_KEY = useSelector(
    s.selectGeminiApiKey
  )

  const GEMINI_MODEL = useSelector(
    s.selectGeminiModel
  )

  // ============================================================
  // OpenRouter
  // ============================================================

  const OPEN_ROUTER_API_KEY = useSelector(
    s.selectOpenRouterApiKey
  )

  const OPEN_ROUTER_MODEL = useSelector(
    s.selectOpenRouterModel
  )

  // ============================================================
  // DeepSeek
  // ============================================================

  const DEEPSEEK_MAIL = useSelector(
    s.selectDeepSeekMail
  )

  const DEEPSEEK_PASSWORD = useSelector(
    s.selectDeepSeekPassword
  )

  // ============================================================
  // ChatGPT
  // ============================================================

  const OPENAI_MAIL = useSelector(
    s.selectOpenaiMail
  )

  const OPENAI_PASSWORD = useSelector(
    s.selectOpenaiPassword
  )

  // ============================================================
  // Ollama
  // ============================================================

  const OLLAMA_URL = useSelector(
    s.selectOllamaUrl
  )

  const OLLAMA_MODEL = useSelector(
    s.selectOllamaModel
  )

  // ============================================================
  // アプリケーション設定
  // ============================================================

  const USE_AI = useSelector(
    s.selectUseAI
  )

  const DATABASE_TYPE = useSelector(
    s.selectDatabaseType
  )

  const AUTO_SYNCHRONIZATION = useSelector(
    s.selectAutoSynchronization
  )

  const AUTO_SWITCHING = useSelector(
    s.selectAutoSwitching
  )

  const STAFF_ID = useSelector(
    s.selectStaffId
  )

  const FACILITY_ID = useSelector(
    s.selectFacilityId
  )

  // ============================================================
  // chilledspaceSlice
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
   * 現在表示しているモード
   *
   * dashboard
   * aiInquiry
   */
  const CURRENT_MODE = useSelector(
    selectCurrentMode
  )

  /**
   * 現在のモードで選択している項目ID
   *
   * 例:
   * dashboardモードの場合は home
   * aiInquiryモードの場合は chat
   */
  const CURRENT_SELECTED_ITEM_ID = useSelector(
    selectCurrentSelectedItemId
  )

  /**
   * dashboardモードで最後に選択した項目ID
   */
  const DASHBOARD_SELECTED_ITEM_ID = useSelector(
    selectDashboardSelectedItemId
  )

  /**
   * aiInquiryモードで最後に選択した項目ID
   */
  const AI_INQUIRY_SELECTED_ITEM_ID = useSelector(
    selectAiInquirySelectedItemId
  )

  /**
   * dashboardモードかどうか
   */
  const IS_DASHBOARD_MODE = useSelector(
    selectIsDashboardMode
  )

  /**
   * AI問い合わせモードかどうか
   */
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

      // 関連テーブル
      facility_children: dbFacilityChildren,
      facility_staff: dbFacilityStaff,
      managers2: dbManagers2,
      pc: dbPc,
      pc_to_children: dbPcToChildren,
      day_of_week: dbDayOfWeek,

      // 記録系
      service_record: dbServiceRecord,
      child_records: dbChildRecords,
      record_types: dbRecordTypes,
      m_service_items: dbMServiceItems,

      // メモ・テキスト系
      temp_notes: dbTempNotes,
      memo: dbMemo,
      text_data: dbTextData,
      toolbox: dbToolbox,
      staff_facility_roles:
        dbStaffFacilityRoles,

      // 認証系
      users: dbUsers,
      refresh_tokens: dbRefreshTokens,
    }),
    [
      dbChildren,
      dbChildrenType,
      dbPronunciation,
      dbStaffs,
      dbFacilitys,
      dbFacilityChildren,
      dbFacilityStaff,
      dbManagers2,
      dbPc,
      dbPcToChildren,
      dbDayOfWeek,
      dbServiceRecord,
      dbChildRecords,
      dbRecordTypes,
      dbMServiceItems,
      dbTempNotes,
      dbMemo,
      dbTextData,
      dbToolbox,
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

      console.log(
        'staffId:',
        staffId
      )

      console.log(
        'weekdayId:',
        weekdayId
      )

      console.log(
        'resolvedWeekdayId:',
        resolvedWeekdayId
      )

      console.log(
        'facilityId:',
        facilityId
      )

      console.log(
        'databaseLoading:',
        databaseLoading
      )

      console.log(
        'databaseError:',
        databaseError
      )

      console.log(
        'databaseMetadata:',
        databaseMetadata
      )

      console.log(
        'table counts:',
        {
          children:
            databaseTables.children.length,

          children_type:
            databaseTables.children_type.length,

          pronunciation:
            databaseTables.pronunciation.length,

          staffs:
            databaseTables.staffs.length,

          facilitys:
            databaseTables.facilitys.length,

          facility_children:
            databaseTables.facility_children.length,

          facility_staff:
            databaseTables.facility_staff.length,

          managers2:
            databaseTables.managers2.length,

          pc:
            databaseTables.pc.length,

          pc_to_children:
            databaseTables.pc_to_children.length,

          day_of_week:
            databaseTables.day_of_week.length,
        }
      )

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
            tables: databaseTables,
            staffId,
            weekdayId:
              resolvedWeekdayId,
            facility_id:
              facilityId,
          })

        console.log(
          '[useReduxBindings/getChildrenDataByDay] result:',
          result
        )

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

    // 関連テーブル
    dbFacilityChildren,
    dbFacilityStaff,
    dbManagers2,
    dbPc,
    dbPcToChildren,
    dbDayOfWeek,

    // 記録系
    dbServiceRecord,
    dbChildRecords,
    dbRecordTypes,
    dbMServiceItems,

    // メモ・テキスト系
    dbTempNotes,
    dbMemo,
    dbTextData,
    dbToolbox,
    dbStaffFacilityRoles,

    // 認証系
    dbUsers,
    dbRefreshTokens,

    // database状態
    databaseLoading,
    databaseError,
    databaseMetadata,

    // databaseSliceから必要時に抽出する関数
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

    AUTO_SYNCHRONIZATION,
    AUTO_SWITCHING,

    STAFF_ID,
    FACILITY_ID,

    activeSpaceId,
    chilledSpaces,

    // web_automation_rules
    webAutomationRuleState,
    webAutomationRules,
    webAutomationRulesByKey,
    webAutomationRulesMeta,
    webAutomationRulesLoading,
    webAutomationRulesError,
    webAutomationRulesLoadedAt,

    CURRENT_DAY_OF_WEEK,
    CURRENT_YMD,

    PROMPTS,
    attendanceData,
    DEBUG_FLG,
    SELECT_CHILD_FILTER_MODE,

    // ==========================================================
    // 表示モード
    // ==========================================================

    CURRENT_MODE,

    /**
     * 現在のモードで選択中の項目ID
     */
    CURRENT_SELECTED_ITEM_ID,

    /**
     * dashboardで最後に選択した項目ID
     */
    DASHBOARD_SELECTED_ITEM_ID,

    /**
     * aiInquiryで最後に選択した項目ID
     */
    AI_INQUIRY_SELECTED_ITEM_ID,

    IS_DASHBOARD_MODE,
    IS_AI_INQUIRY_MODE,
  }
}