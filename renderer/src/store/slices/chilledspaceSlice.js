// src/store/slices/chilledspaceSlice.js
// 2人の児童を同時に扱うための作業スペース状態管理

import { createSlice } from '@reduxjs/toolkit'

const createSpace = () => ({
  childId: '',
  childName: '',
  pcName: '',

  // 選択中児童の出勤データ列
  selectedChildColumn5: null,
  selectedChildColumn5Html: null,
  selectedChildColumn6: null,
  selectedChildColumn6Html: null,
})

const initialState = {
  activeSpaceId: 'left',
  spaces: {
    left: createSpace(),
    right: createSpace(),
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
    setActiveSpaceId: (state, action) => {
      const spaceId = action.payload
      getSpace(state, spaceId)
      state.activeSpaceId = spaceId
    },

    setSpaceChild: (state, action) => {
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
      const { spaceId, pcName } = action.payload || {}
      const space = getSpace(state, spaceId)
      space.pcName = pcName || ''
    },

    setSpaceChildColumns: (state, action) => {
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
      const spaceId = action.payload
      getSpace(state, spaceId)
      state.spaces[spaceId] = createSpace()
    },

    resetChilledspace: () => initialState,
  },
})

export const {
  setActiveSpaceId,
  setSpaceChild,
  setSpacePcName,
  setSpaceChildColumns,
  clearSpace,
  resetChilledspace,
} = chilledspaceSlice.actions

export const selectActiveSpaceId = (state) =>
  state.chilledspace.activeSpaceId

export const selectSpaces = (state) =>
  state.chilledspace.spaces

export const selectSpace = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]

export const selectSpaceChildId = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]?.childId ?? ''

export const selectSpaceChildName = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]?.childName ?? ''

export const selectSpacePcName = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]?.pcName ?? ''

export const selectSpaceChildColumn5 = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]?.selectedChildColumn5 ?? null

export const selectSpaceChildColumn5Html = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]?.selectedChildColumn5Html ?? null

export const selectSpaceChildColumn6 = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]?.selectedChildColumn6 ?? null

export const selectSpaceChildColumn6Html = (spaceId) => (state) =>
  state.chilledspace.spaces[spaceId]?.selectedChildColumn6Html ?? null

export default chilledspaceSlice.reducer
