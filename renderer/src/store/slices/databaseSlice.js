// src/store/slices/databaseSlice.js
// SQLite / MariaDB テーブルデータの状態管理

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'

// =============================================================
// Redux に保存する実テーブル一覧
// ※ VIEW は同期対象にしない
// =============================================================
const tableKeys = [
  // 基本マスタ
  'children',
  'children_type',
  'pronunciation',
  'staffs',
  'facilitys',
  'companies',
  'roles',
  'company_roles',
  'staff_company_roles',

  // 関連テーブル
  'facility_children',
  'facility_staff',
  'managers2',
  'pc',
  'pc_to_children',
  'day_of_week',

  // 記録系
  'service_record',
  'child_records',
  'record_types',
  'm_service_items',

  // メモ・テキスト系
  'temp_notes',
  'memo',
  'text_data',
  'toolbox',
  'staff_facility_roles',

  // 認証系
  // ローカルSQLiteへ保存してよいか要注意
  'users',
  'refresh_tokens',
]

// =============================================================
// payload → state へのマッピング
// =============================================================
const applyPayloadToState = (state, payload = {}) => {
  tableKeys.forEach((key) => {
    // service_recordは月次取得で個別に更新する。
    // 全件取得レスポンスに含まれない場合、現在の月次データを保持する。
    if (
      key === 'service_record' &&
      !Object.prototype.hasOwnProperty.call(payload, key)
    ) {
      return
    }

    state[key] = Array.isArray(payload[key]) ? payload[key] : []
  })
}

// =============================================================
// asyncThunk
// ※ 現状は payload をそのまま fulfilled に渡すだけ
// =============================================================
export const fetchAllTables = createAsyncThunk(
  'sqlite/fetchAllTables',
  async (payload) => payload
)

// =============================================================
// 初期状態
// =============================================================
const initialState = {
  // 基本マスタ
  children: [],
  children_type: [],
  pronunciation: [],
  staffs: [],
  facilitys: [],
  companies: [],
  roles: [],
  company_roles: [],
  staff_company_roles: [],

  // 関連テーブル
  facility_children: [],
  facility_staff: [],
  managers2: [],
  pc: [],
  pc_to_children: [],
  day_of_week: [],

  // 記録系
  service_record: [],
  child_records: [],
  record_types: [],
  m_service_items: [],

  // メモ・テキスト系
  temp_notes: [],
  memo: [],
  text_data: [],
  toolbox: [],
  staff_facility_roles: [],

  // 認証系
  users: [],
  refresh_tokens: [],

  // Redux 管理用
  loading: false,
  error: null,
  metadata: {
    lastFetched: null,
    fetchedAt: null,
  },
}

// =============================================================
// Slice
// =============================================================
const databaseSlice = createSlice({
  name: 'sqlite',
  initialState,

  reducers: {
    setAllTables: (state, action) => {
      applyPayloadToState(state, action.payload)

      const now = new Date().toISOString()
      state.metadata.lastFetched = now
      state.metadata.fetchedAt = now
      state.error = null
    },

    setServiceRecord: (state, action) => {
      state.service_record = Array.isArray(action.payload)
        ? action.payload
        : []
    },

    clearSqliteData: (state) => {
      tableKeys.forEach((key) => {
        state[key] = []
      })

      state.error = null
      state.metadata = {
        lastFetched: null,
        fetchedAt: null,
      }
    },

    clearError: (state) => {
      state.error = null
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchAllTables.pending, (state) => {
        state.loading = true
        state.error = null
      })

      .addCase(fetchAllTables.fulfilled, (state, action) => {
        state.loading = false

        applyPayloadToState(state, action.payload)

        const now = new Date().toISOString()
        state.metadata.lastFetched = now
        state.metadata.fetchedAt = now
        state.error = null
      })

      .addCase(fetchAllTables.rejected, (state, action) => {
        state.loading = false
        state.error = action.error?.message || 'データ保存に失敗しました'
      })
  },
})

export const {
  setAllTables,
  setServiceRecord,
  clearSqliteData,
  clearError,
} = databaseSlice.actions

// =============================================================
// Selectors
// =============================================================

export const selectDatabaseState = (state) => state.database ?? initialState

// 基本マスタ
export const selectChildren = (state) => state.database?.children ?? []
export const selectChildrenType = (state) =>
  state.database?.children_type ?? []
export const selectPronunciation = (state) =>
  state.database?.pronunciation ?? []
export const selectStaffs = (state) => state.database?.staffs ?? []
export const selectCompanies = (state) => state.database?.companies ?? []
export const selectRoles = (state) => state.database?.roles ?? []
export const selectCompanyRoles = (state) => state.database?.company_roles ?? []
export const selectStaffCompanyRoles = (state) => state.database?.staff_company_roles ?? []
export const selectFacilitys = (state) => state.database?.facilitys ?? []

// 関連テーブル
export const selectFacilityChildren = (state) =>
  state.database?.facility_children ?? []
export const selectFacilityStaff = (state) =>
  state.database?.facility_staff ?? []
export const selectManagers2 = (state) => state.database?.managers2 ?? []
export const selectPc = (state) => state.database?.pc ?? []
export const selectPcToChildren = (state) =>
  state.database?.pc_to_children ?? []
export const selectDayOfWeek = (state) => state.database?.day_of_week ?? []

// 記録系
export const selectServiceRecord = (state) =>
  state.database?.service_record ?? []
export const selectChildRecords = (state) =>
  state.database?.child_records ?? []
export const selectRecordTypes = (state) =>
  state.database?.record_types ?? []
export const selectMServiceItems = (state) =>
  state.database?.m_service_items ?? []

// メモ・テキスト系
export const selectTempNotes = (state) =>
  state.database?.temp_notes ?? []
export const selectMemo = (state) => state.database?.memo ?? []
export const selectTextData = (state) => state.database?.text_data ?? []
export const selectToolbox = (state) => state.database?.toolbox ?? []
export const selectStaffFacilityRoles = (state) =>
  state.database?.staff_facility_roles ?? []

// 認証系
export const selectUsers = (state) => state.database?.users ?? []
export const selectRefreshTokens = (state) =>
  state.database?.refresh_tokens ?? []

// 状態系
export const selectDatabaseLoading = (state) =>
  state.database?.loading ?? false
export const selectDatabaseError = (state) =>
  state.database?.error ?? null
export const selectDatabaseMetadata = (state) =>
  state.database?.metadata ?? {
    lastFetched: null,
    fetchedAt: null,
  }

export default databaseSlice.reducer
