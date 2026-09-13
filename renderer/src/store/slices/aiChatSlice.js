import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  // AIに送信するテキストを
  // 日付 -> 児童ID -> text の順で保持する。
  byDate: {},
}

const normalizeDate = (value) =>
  value != null ? String(value).trim() : ''

const normalizeChildId = (value) =>
  value != null ? String(value).trim() : ''

const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState,
  reducers: {
    setAiChatText: (state, action) => {
      const {
        date,
        childId,
        text,
      } = action.payload || {}

      const dateKey = normalizeDate(date)
      const childKey = normalizeChildId(childId)

      // 日付・児童のどちらかが未選択なら保存しない。
      if (!dateKey || !childKey) {
        return
      }

      if (!state.byDate[dateKey]) {
        state.byDate[dateKey] = {}
      }

      state.byDate[dateKey][childKey] = {
        text: typeof text === 'string' ? text : '',
      }
    },

    clearAiChatText: (state, action) => {
      const {
        date,
        childId,
      } = action.payload || {}

      const dateKey = normalizeDate(date)
      const childKey = normalizeChildId(childId)

      if (!dateKey || !childKey || !state.byDate[dateKey]) {
        return
      }

      delete state.byDate[dateKey][childKey]

      if (Object.keys(state.byDate[dateKey]).length === 0) {
        delete state.byDate[dateKey]
      }
    },

    clearAiChatDate: (state, action) => {
      const dateKey = normalizeDate(action.payload)

      if (!dateKey) {
        return
      }

      delete state.byDate[dateKey]
    },

    resetAiChat: () => initialState,
  },
})

export const {
  setAiChatText,
  clearAiChatText,
  clearAiChatDate,
  resetAiChat,
} = aiChatSlice.actions

export const selectAiChatText = (date, childId) => (state) => {
  const dateKey = normalizeDate(date)
  const childKey = normalizeChildId(childId)

  if (!dateKey || !childKey) {
    return ''
  }

  return state.aiChat?.byDate?.[dateKey]?.[childKey]?.text ?? ''
}

export const selectAiChatDateEntries = (date) => (state) => {
  const dateKey = normalizeDate(date)

  if (!dateKey) {
    return {}
  }

  return state.aiChat?.byDate?.[dateKey] ?? {}
}

export default aiChatSlice.reducer
