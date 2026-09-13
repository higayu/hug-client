import { createSlice } from '@reduxjs/toolkit'

export const AI_CHAT_TEXT_KEYS = {
  PERSONAL: 'personal',
  PROFESSIONAL_1: 'professional1',
  PROFESSIONAL_2: 'professional2',
}

const initialState = {
  // AIに送信するテキストを
  // 日付 -> 児童ID -> 種別 -> text の順で保持する。
  //
  // 例:
  // byDate['2026-09-13']['99']['personal'].text
  // byDate['2026-09-13']['99']['professional1'].text
  // byDate['2026-09-13']['99']['professional2'].text
  byDate: {},
}

const normalizeDate = (value) =>
  value != null ? String(value).trim() : ''

const normalizeChildId = (value) =>
  value != null ? String(value).trim() : ''

const normalizeKey = (value) =>
  value != null ? String(value).trim() : ''

const isValidKey = (key) =>
  Object.values(AI_CHAT_TEXT_KEYS).includes(key)

const aiChatSlice = createSlice({
  name: 'aiChat',
  initialState,
  reducers: {
    setAiChatText: (state, action) => {
      const {
        date,
        childId,
        key,
        text,
      } = action.payload || {}

      const dateKey = normalizeDate(date)
      const childKey = normalizeChildId(childId)
      const textKey = normalizeKey(key)

      // 日付・児童・種別のいずれかが未選択なら保存しない。
      if (!dateKey || !childKey || !isValidKey(textKey)) {
        return
      }

      if (!state.byDate[dateKey]) {
        state.byDate[dateKey] = {}
      }

      if (!state.byDate[dateKey][childKey]) {
        state.byDate[dateKey][childKey] = {}
      }

      state.byDate[dateKey][childKey][textKey] = {
        text: typeof text === 'string' ? text : '',
      }
    },

    clearAiChatText: (state, action) => {
      const {
        date,
        childId,
        key,
      } = action.payload || {}

      const dateKey = normalizeDate(date)
      const childKey = normalizeChildId(childId)
      const textKey = normalizeKey(key)

      if (
        !dateKey ||
        !childKey ||
        !isValidKey(textKey) ||
        !state.byDate[dateKey]?.[childKey]
      ) {
        return
      }

      delete state.byDate[dateKey][childKey][textKey]

      if (Object.keys(state.byDate[dateKey][childKey]).length === 0) {
        delete state.byDate[dateKey][childKey]
      }

      if (Object.keys(state.byDate[dateKey]).length === 0) {
        delete state.byDate[dateKey]
      }
    },

    clearAiChatChild: (state, action) => {
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
  clearAiChatChild,
  clearAiChatDate,
  resetAiChat,
} = aiChatSlice.actions

export const selectAiChatText = (date, childId, key) => (state) => {
  const dateKey = normalizeDate(date)
  const childKey = normalizeChildId(childId)
  const textKey = normalizeKey(key)

  if (!dateKey || !childKey || !isValidKey(textKey)) {
    return ''
  }

  return (
    state.aiChat?.byDate?.[dateKey]?.[childKey]?.[textKey]?.text ?? ''
  )
}

export const selectAiChatChildEntries = (date, childId) => (state) => {
  const dateKey = normalizeDate(date)
  const childKey = normalizeChildId(childId)

  if (!dateKey || !childKey) {
    return {}
  }

  return state.aiChat?.byDate?.[dateKey]?.[childKey] ?? {}
}

export const selectAiChatDateEntries = (date) => (state) => {
  const dateKey = normalizeDate(date)

  if (!dateKey) {
    return {}
  }

  return state.aiChat?.byDate?.[dateKey] ?? {}
}

export default aiChatSlice.reducer
