import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  items: [],
  byKey: {},
  meta: {
    count: 0,
    category: null,
    max_version: 0,
    latest_updated_at: null,
  },
  loading: false,
  error: null,
  loadedAt: null,
}

function buildByKey(items) {
  return (Array.isArray(items) ? items : []).reduce(
    (result, rule) => {
      const ruleKey = rule?.rule_key

      if (!ruleKey) {
        return result
      }

      result[String(ruleKey)] = rule

      return result
    },
    {}
  )
}

const webAutomationRuleSlice = createSlice({
  name: 'webAutomationRules',
  initialState,

  reducers: {
    setWebAutomationRulesLoading(state, action) {
      state.loading = Boolean(action.payload)

      if (state.loading) {
        state.error = null
      }
    },

    setWebAutomationRules(state, action) {
      const payload = action.payload ?? {}
      const items = Array.isArray(payload.items)
        ? payload.items
        : []

      state.items = items
      state.byKey = buildByKey(items)

      state.meta = {
        ...initialState.meta,
        ...(payload.meta ?? {}),
        count: items.length,
      }

      state.loading = false
      state.error = null
      state.loadedAt = new Date().toISOString()
    },

    upsertWebAutomationRule(state, action) {
      const rule = action.payload

      if (!rule?.rule_key) {
        return
      }

      const ruleKey = String(rule.rule_key)

      state.byKey[ruleKey] = rule

      const index = state.items.findIndex(
        (item) => String(item?.rule_key) === ruleKey
      )

      if (index >= 0) {
        state.items[index] = rule
      } else {
        state.items.push(rule)
      }

      state.meta.count = state.items.length
      state.loading = false
      state.error = null
      state.loadedAt = new Date().toISOString()
    },

    setWebAutomationRulesError(state, action) {
      state.loading = false
      state.error =
        action.payload != null
          ? String(action.payload)
          : 'web_automation_rules の取得に失敗しました'
    },

    clearWebAutomationRules() {
      return initialState
    },
  },
})

export const {
  setWebAutomationRulesLoading,
  setWebAutomationRules,
  upsertWebAutomationRule,
  setWebAutomationRulesError,
  clearWebAutomationRules,
} = webAutomationRuleSlice.actions

export const selectWebAutomationRuleState = (state) =>
  state.webAutomationRules

export const selectWebAutomationRules = (state) =>
  state.webAutomationRules?.items ?? []

export const selectWebAutomationRulesByKey = (state) =>
  state.webAutomationRules?.byKey ?? {}

export const selectWebAutomationRulesMeta = (state) =>
  state.webAutomationRules?.meta ?? initialState.meta

export const selectWebAutomationRulesLoading = (state) =>
  Boolean(state.webAutomationRules?.loading)

export const selectWebAutomationRulesError = (state) =>
  state.webAutomationRules?.error ?? null

export const selectWebAutomationRulesLoadedAt = (state) =>
  state.webAutomationRules?.loadedAt ?? null

export const selectWebAutomationRuleByKey =
  (ruleKey) =>
  (state) =>
    state.webAutomationRules?.byKey?.[String(ruleKey)] ?? null

export default webAutomationRuleSlice.reducer
