export const ALL_SYNC_FLOW_KEY = 'all_sync'

export const ALL_SYNC_SCOPE = {
  app_key: 'hug-banso-navi',
  webview_key: '*',
}

function parseMaybeJson(value, fallback = {}) {
  if (value == null || value === '') return fallback
  if (typeof value === 'object') return value
  if (typeof value !== 'string') return fallback

  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function collectObjects(value, list = []) {
  if (!value || typeof value !== 'object') return list

  if (!Array.isArray(value)) list.push(value)

  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') {
      collectObjects(child, list)
    }
  })

  return list
}

function unwrapFlowResponse(response) {
  if (response?.data?.data) return response.data.data
  if (response?.data) return response.data
  return response
}

function normalizeRuleEntry(rule, step = null) {
  return {
    step,
    rule,
    config: parseMaybeJson(rule?.config_json, {}),
    input: parseMaybeJson(step?.input_json, {}),
    stepConfig: parseMaybeJson(step?.config_json, {}),
  }
}

export async function loadAllSyncAutomation() {
  const api = window.electronAPI?.laravel_webAutomationFlow_get

  if (typeof api !== 'function') {
    throw new Error(
      'laravel_webAutomationFlow_get が preload に公開されていません。',
    )
  }

  const response = await api(
    ALL_SYNC_FLOW_KEY,
    ALL_SYNC_SCOPE,
  )

  const flow = unwrapFlowResponse(response)
  if (!flow) {
    throw new Error('all_sync Flowを取得できませんでした。')
  }

  const objects = collectObjects(flow)
  const rules = {}

  for (const object of objects) {
    const directRuleKey = String(object?.rule_key ?? '').trim()
    if (directRuleKey && object?.config_json != null) {
      rules[directRuleKey] ??= normalizeRuleEntry(object)
    }

    const nestedRule = object?.rule
    const nestedRuleKey = String(nestedRule?.rule_key ?? '').trim()
    if (nestedRuleKey) {
      rules[nestedRuleKey] = normalizeRuleEntry(
        nestedRule,
        object,
      )
    }
  }

  const requiredRuleKeys = [
    'staff_fetch',
    'children_fetch',
    'personal_record_list_fetch',
    'personal_record_detail_fetch',
  ]

  const missing = requiredRuleKeys.filter(
    (ruleKey) => !rules[ruleKey],
  )

  if (missing.length > 0) {
    throw new Error(
      `all_sync Flowに必要なRuleがありません: ${missing.join(', ')}`,
    )
  }

  return {
    response,
    flow,
    rules,
  }
}
