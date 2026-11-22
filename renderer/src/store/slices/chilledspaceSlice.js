// src/store/slices/chilledspaceSlice.js
// Dashboard のクイック操作モードで使用する作業スペース状態管理

import { createSlice } from '@reduxjs/toolkit'
import { isSimpleBoardSpaceId } from './simpleBoardSlice.js'

const MIN_SPACE_COUNT = 1
const MAX_SPACE_COUNT = 2

const createSpace = () => ({
  childId: '',
  childName: '',
  pcName: '',

  // FanContent内で現在表示している作業パネル。
  // top / bottom それぞれ独立して管理する。
  activeFanContentPanel: 'ai',

  // 選択中児童の出勤データ列
  selectedChildColumn5: null,
  selectedChildColumn5Html: null,
  selectedChildColumn6: null,
  selectedChildColumn6Html: null,
})

const initialState = {
  // 上下分割なので top / bottom で統一する。
  activeSpaceId: 'top',

  // 現状は 1 ～ 2 枠だけをサポートする。
  spaceCount: MIN_SPACE_COUNT,

  spaces: {
    top: createSpace(),
    bottom: createSpace(),
  },
}

const getSpace = (state, spaceId) => {
  if (!spaceId || !state.spaces[spaceId]) {
    throw new Error(`[chilledspaceSlice] unknown spaceId: ${spaceId}`)
  }

  return state.spaces[spaceId]
}

const chilledspaceSlice = createSlice({
  name: 'chilledspace',
  initialState,
  reducers: {
    addChilledSpace: (state) => {
      if (state.spaceCount >= MAX_SPACE_COUNT) {
        return
      }

      // 2枠目は常に bottom。
      state.spaces.bottom = createSpace()
      state.spaceCount = 2
      state.activeSpaceId = 'bottom'
    },

    deleteChilledSpace: (state, action) => {
      if (isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload)) return

      if (state.spaceCount <= MIN_SPACE_COUNT) {
        return
      }

      const spaceId = action.payload
      getSpace(state, spaceId)

      if (spaceId === 'top') {
        // top を削除した場合は bottom の作業内容を top に繰り上げる。
        state.spaces.top = state.spaces.bottom
      }

      // bottom を削除した場合も、top 削除後の繰り上げ時も
      // bottom は空の状態へ戻す。
      state.spaces.bottom = createSpace()
      state.spaceCount = 1
      state.activeSpaceId = 'top'
    },

    setActiveSpaceId: (state, action) => {
      if (isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload)) return

      const spaceId = action.payload
      getSpace(state, spaceId)

      if (spaceId === 'bottom' && state.spaceCount < 2) {
        throw new Error(
          '[chilledspaceSlice] bottom space is not active while spaceCount is 1'
        )
      }

      state.activeSpaceId = spaceId
    },

    setSpaceActiveFanContentPanel: (state, action) => {
      if (isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload)) return

      const {
        spaceId,
        panelId,
      } = action.payload || {}

      const space = getSpace(state, spaceId)
      space.activeFanContentPanel = panelId || 'ai'
    },

    setSpaceChild: (state, action) => {
      if (isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload)) return

      const { spaceId, childId, childName } = action.payload || {}
      const space = getSpace(state, spaceId)

      space.childId = childId != null ? String(childId) : ''
      space.childName = childName || ''

      // 児童変更時は児童依存データをクリア
      space.pcName = ''
      space.selectedChildColumn5 = null
      space.selectedChildColumn5Html = null
      space.selectedChildColumn6 = null
      space.selectedChildColumn6Html = null
    },

    setSpacePcName: (state, action) => {
      if (isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload)) return

      const { spaceId, pcName } = action.payload || {}
      const space = getSpace(state, spaceId)
      space.pcName = pcName || ''
    },

    setSpaceChildColumns: (state, action) => {
      if (isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload)) return

      const {
        spaceId,
        column5,
        column5Html,
        column6,
        column6Html,
      } = action.payload || {}

      const space = getSpace(state, spaceId)

      space.selectedChildColumn5 =
        column5 !== undefined ? column5 : null

      space.selectedChildColumn5Html =
        column5Html !== undefined ? column5Html : null

      space.selectedChildColumn6 =
        column6 !== undefined ? column6 : null

      space.selectedChildColumn6Html =
        column6Html !== undefined ? column6Html : null
    },

    clearSpace: (state, action) => {
      if (isSimpleBoardSpaceId(action.payload?.spaceId ?? action.payload)) return

      const spaceId = action.payload
      getSpace(state, spaceId)
      state.spaces[spaceId] = createSpace()
    },

    resetChilledspace: () => initialState,
  },
})

export const {
  addChilledSpace,
  deleteChilledSpace,
  setActiveSpaceId,
  setSpaceActiveFanContentPanel,
  setSpaceChild,
  setSpacePcName,
  setSpaceChildColumns,
  clearSpace,
  resetChilledspace,
} = chilledspaceSlice.actions

export const selectActiveSpaceId = (state) =>
  state.chilledspace.activeSpaceId

export const selectSpaceCount = (state) =>
  state.chilledspace.spaceCount

export const selectCanAddChilledSpace = (state) =>
  state.chilledspace.spaceCount < MAX_SPACE_COUNT

export const selectCanDeleteChilledSpace = (state) =>
  state.chilledspace.spaceCount > MIN_SPACE_COUNT

export const selectSpaces = (state) =>
  state.chilledspace.spaces

// Preserve existing imports while sharing space resolution across both boards.
export {
  selectSpace,
  selectSpaceActiveFanContentPanel,
  selectSpaceChildId,
  selectSpaceChildName,
  selectSpacePcName,
  selectSpaceChildColumn5,
  selectSpaceChildColumn5Html,
  selectSpaceChildColumn6,
  selectSpaceChildColumn6Html,
} from '../workSpaceSelectors.js'

export default chilledspaceSlice.reducer
