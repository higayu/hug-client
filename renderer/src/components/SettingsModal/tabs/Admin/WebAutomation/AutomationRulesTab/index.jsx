import { useCallback, useEffect, useMemo, useState } from 'react'

import { useToast } from '@/provider/ToastProvider/ToastContext'

const DEFAULT_APP_KEY = 'hug-banso-navi'
const DEFAULT_WEBVIEW_KEY = '*'

const EMPTY_RULE_FORM = {
  rule_key: '',
  name: '',
  category: '',
  action_type: '',
  target_url_pattern: '',
  target_selector: '',
  parser_type: '',
  function_name: '',
  config_json: '{}',
  is_active: true,
  sort_order: 0,
  version: 1,
}

function normalizeResponseData(result) {
  if (Array.isArray(result?.data)) {
    return result.data
  }

  if (Array.isArray(result?.data?.data)) {
    return result.data.data
  }

  if (Array.isArray(result)) {
    return result
  }

  return []
}

function normalizeSingleData(result) {
  if (result?.data?.data && !Array.isArray(result.data.data)) {
    return result.data.data
  }

  return result?.data ?? null
}

function stringifyJson(value) {
  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

function toRuleForm(rule) {
  if (!rule) {
    return { ...EMPTY_RULE_FORM }
  }

  return {
    rule_key: String(rule.rule_key ?? ''),
    name: String(rule.name ?? ''),
    category: String(rule.category ?? ''),
    action_type: String(rule.action_type ?? ''),
    target_url_pattern: String(rule.target_url_pattern ?? ''),
    target_selector: String(rule.target_selector ?? ''),
    parser_type: String(rule.parser_type ?? ''),
    function_name: String(rule.function_name ?? ''),
    config_json: stringifyJson(rule.config_json),
    is_active: Boolean(rule.is_active),
    sort_order: Number(rule.sort_order ?? 0),
    version: Number(rule.version ?? 1),
  }
}

function normalizeMemo(memo, index = 0) {
  if (!memo) return null

  const id = memo.id == null ? null : Number(memo.id)

  return {
    ...memo,
    id,
    _client_id:
      memo._client_id ??
      (id == null ? `new-${index}` : `memo-${id}`),
    rule_id:
      memo.rule_id == null
        ? null
        : Number(memo.rule_id),
    memo: String(memo.memo ?? ''),
    sort_order: Number(memo.sort_order ?? 0),
    is_active: Boolean(memo.is_active),
  }
}

function normalizeMemos(memos) {
  if (!Array.isArray(memos)) {
    return []
  }

  return memos
    .map((memo, index) => normalizeMemo(memo, index))
    .filter(Boolean)
    .sort((a, b) => {
      const orderDiff = a.sort_order - b.sort_order

      if (orderDiff !== 0) {
        return orderDiff
      }

      return Number(a.id ?? Number.MAX_SAFE_INTEGER) -
        Number(b.id ?? Number.MAX_SAFE_INTEGER)
    })
}

function normalizeRule(rule) {
  if (!rule?.rule_key) return null

  return {
    ...rule,
    rule_key: String(rule.rule_key),
    app_key: String(rule.app_key ?? ''),
    webview_key: String(rule.webview_key ?? ''),
    memos: normalizeMemos(rule.memos),
  }
}

function normalizeFlow(flow) {
  if (!flow?.flow_key) return null

  return {
    ...flow,
    flow_key: String(flow.flow_key),
    app_key: String(flow.app_key ?? ''),
    webview_key: String(flow.webview_key ?? ''),
    steps: Array.isArray(flow.steps) ? flow.steps : [],
  }
}

export default function AutomationRulesTab() {
  const {
    showSuccessToast,
    showErrorToast,
  } = useToast()

  const [activeTab, setActiveTab] = useState('rules')

  const [appKey, setAppKey] = useState(DEFAULT_APP_KEY)
  const [webviewKey, setWebviewKey] = useState(DEFAULT_WEBVIEW_KEY)

  const [rules, setRules] = useState([])
  const [rulesLoading, setRulesLoading] = useState(false)
  const [rulesError, setRulesError] = useState('')

  const [selectedRuleKey, setSelectedRuleKey] = useState('')
  const [form, setForm] = useState({ ...EMPTY_RULE_FORM })
  const [savedForm, setSavedForm] = useState({ ...EMPTY_RULE_FORM })
  const [isSaving, setIsSaving] = useState(false)
  const [jsonError, setJsonError] = useState('')
  const [memos, setMemos] = useState([])
  const [savedMemos, setSavedMemos] = useState([])
  const [deletedMemoIds, setDeletedMemoIds] = useState([])

  const [flows, setFlows] = useState([])
  const [flowsLoading, setFlowsLoading] = useState(false)
  const [flowsError, setFlowsError] = useState('')
  const [selectedFlowKey, setSelectedFlowKey] = useState('')
  const [triggerType, setTriggerType] = useState('')

  const scope = useMemo(
    () => ({
      app_key: appKey.trim() || DEFAULT_APP_KEY,
      webview_key: webviewKey.trim() || DEFAULT_WEBVIEW_KEY,
    }),
    [appKey, webviewKey],
  )

  const sortedRules = useMemo(
    () =>
      [...rules]
        .map(normalizeRule)
        .filter(Boolean)
        .sort((a, b) => {
          const orderDiff =
            Number(a.sort_order ?? 0) -
            Number(b.sort_order ?? 0)

          if (orderDiff !== 0) {
            return orderDiff
          }

          return a.rule_key.localeCompare(b.rule_key, 'ja')
        }),
    [rules],
  )

  const sortedFlows = useMemo(
    () =>
      [...flows]
        .map(normalizeFlow)
        .filter(Boolean)
        .sort((a, b) =>
          a.flow_key.localeCompare(b.flow_key, 'ja'),
        ),
    [flows],
  )

  const selectedRule = useMemo(
    () =>
      sortedRules.find(
        (rule) => rule.rule_key === selectedRuleKey,
      ) ?? null,
    [sortedRules, selectedRuleKey],
  )

  const selectedFlow = useMemo(
    () =>
      sortedFlows.find(
        (flow) => flow.flow_key === selectedFlowKey,
      ) ?? null,
    [sortedFlows, selectedFlowKey],
  )

  const applyRuleToForm = useCallback((rule) => {
    const nextForm = toRuleForm(rule)
    const nextMemos = normalizeMemos(rule?.memos)

    setForm(nextForm)
    setSavedForm(nextForm)
    setMemos(nextMemos)
    setSavedMemos(nextMemos)
    setDeletedMemoIds([])
    setJsonError('')
  }, [])

  const loadRuleDetail = useCallback(
    async (ruleKey) => {
      const key = String(ruleKey ?? '').trim()
      if (!key) return null

      const api =
        window.electronAPI?.laravel_webAutomationRule_get

      if (typeof api !== 'function') {
        throw new Error(
          'laravel_webAutomationRule_get がpreloadに公開されていません。',
        )
      }

      const result = await api(key, {
        ...scope,
        include_inactive_memos: true,
      })

      if (!result?.success) {
        throw new Error(
          result?.message ??
            result?.error ??
            '自動化ルール詳細の取得に失敗しました。',
        )
      }

      return normalizeRule(normalizeSingleData(result))
    },
    [scope],
  )

  const loadRules = useCallback(
    async (showToast = false) => {
      const api =
        window.electronAPI?.laravel_webAutomationRules_getAll

      if (typeof api !== 'function') {
        const message =
          'laravel_webAutomationRules_getAll がpreloadに公開されていません。'
        setRulesError(message)
        showErrorToast(message)
        return
      }

      setRulesLoading(true)
      setRulesError('')

      try {
        const result = await api(scope)

        if (!result?.success) {
          throw new Error(
            result?.message ??
              result?.error ??
              '自動化ルールの取得に失敗しました。',
          )
        }

        const items = normalizeResponseData(result)
          .map(normalizeRule)
          .filter(Boolean)

        setRules(items)

        const nextKey =
          items.some(
            (rule) => rule.rule_key === selectedRuleKey,
          )
            ? selectedRuleKey
            : String(items[0]?.rule_key ?? '')

        setSelectedRuleKey(nextKey)

        let nextRule =
          items.find(
            (rule) => rule.rule_key === nextKey,
          ) ?? null

        if (nextKey) {
          try {
            nextRule =
              (await loadRuleDetail(nextKey)) ?? nextRule
          } catch (detailError) {
            console.warn(
              '[AutomationRulesTab] Rule詳細取得エラー:',
              detailError,
            )
          }
        }

        applyRuleToForm(nextRule)

        if (showToast) {
          showSuccessToast(
            `Ruleを再読み込みしました。(${items.length}件)`,
          )
        }
      } catch (error) {
        const message =
          error?.message ??
          '自動化ルールの取得に失敗しました。'

        console.error(
          '[AutomationRulesTab] Rule取得エラー:',
          error,
        )

        setRules([])
        setRulesError(message)
        showErrorToast(message)
      } finally {
        setRulesLoading(false)
      }
    },
    [
      scope,
      selectedRuleKey,
      applyRuleToForm,
      loadRuleDetail,
      showErrorToast,
      showSuccessToast,
    ],
  )

  const loadFlows = useCallback(
    async (showToast = false) => {
      const api =
        window.electronAPI?.laravel_webAutomationFlows_getAll

      if (typeof api !== 'function') {
        const message =
          'laravel_webAutomationFlows_getAll がpreloadに公開されていません。'
        setFlowsError(message)
        showErrorToast(message)
        return
      }

      setFlowsLoading(true)
      setFlowsError('')

      try {
        const params = {
          ...scope,
        }

        if (triggerType.trim()) {
          params.trigger_type = triggerType.trim()
        }

        const result = await api(params)

        if (!result?.success) {
          throw new Error(
            result?.message ??
              result?.error ??
              '自動化フローの取得に失敗しました。',
          )
        }

        const items = normalizeResponseData(result)
          .map(normalizeFlow)
          .filter(Boolean)

        setFlows(items)

        const nextKey =
          items.some(
            (flow) => flow.flow_key === selectedFlowKey,
          )
            ? selectedFlowKey
            : String(items[0]?.flow_key ?? '')

        setSelectedFlowKey(nextKey)

        if (showToast) {
          showSuccessToast(
            `Flowを再読み込みしました。(${items.length}件)`,
          )
        }
      } catch (error) {
        const message =
          error?.message ??
          '自動化フローの取得に失敗しました。'

        console.error(
          '[AutomationRulesTab] Flow取得エラー:',
          error,
        )

        setFlows([])
        setFlowsError(message)
        showErrorToast(message)
      } finally {
        setFlowsLoading(false)
      }
    },
    [
      scope,
      triggerType,
      selectedFlowKey,
      showErrorToast,
      showSuccessToast,
    ],
  )

  useEffect(() => {
    loadRules()
    loadFlows()
  }, [])

  const handleScopeReload = async () => {
    await Promise.all([
      loadRules(true),
      loadFlows(true),
    ])
  }

  const updateField = (key, value) => {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }))
  }

  const handleConfigJsonChange = (value) => {
    updateField('config_json', value)

    if (!value.trim()) {
      setJsonError('')
      return
    }

    try {
      JSON.parse(value)
      setJsonError('')
    } catch (error) {
      setJsonError(
        error?.message ?? 'JSON形式が不正です',
      )
    }
  }

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(
        form.config_json || '{}',
      )

      updateField(
        'config_json',
        JSON.stringify(parsed, null, 2),
      )

      setJsonError('')
    } catch (error) {
      setJsonError(
        error?.message ?? 'JSON形式が不正です',
      )
      showErrorToast(
        'config_json のJSON形式が不正です。',
      )
    }
  }

  const handleReset = () => {
    setForm({ ...savedForm })
    setMemos(normalizeMemos(savedMemos))
    setDeletedMemoIds([])
    setJsonError('')
  }

  const handleSelectRule = async (rule) => {
    const ruleKey = String(rule?.rule_key ?? '')
    setSelectedRuleKey(ruleKey)

    try {
      const detailRule = await loadRuleDetail(ruleKey)
      applyRuleToForm(detailRule ?? rule)
    } catch (error) {
      console.error(
        '[AutomationRulesTab] Rule詳細取得エラー:',
        error,
      )
      applyRuleToForm(rule)
      showErrorToast(
        error?.message ??
          'Rule詳細の取得に失敗しました。',
      )
    }
  }

  const handleAddMemo = () => {
    setMemos((previous) => [
      ...previous,
      normalizeMemo({
        _client_id: `new-${Date.now()}-${previous.length}`,
        memo: '',
        sort_order: previous.length,
        is_active: true,
      }),
    ])
  }

  const handleMemoChange = (clientId, key, value) => {
    setMemos((previous) =>
      previous.map((memo) =>
        memo._client_id === clientId
          ? { ...memo, [key]: value }
          : memo,
      ),
    )
  }

  const handleDeleteMemo = (memo) => {
    if (memo?.id != null) {
      setDeletedMemoIds((previous) =>
        previous.includes(Number(memo.id))
          ? previous
          : [...previous, Number(memo.id)],
      )
    }

    setMemos((previous) =>
      previous.filter(
        (item) => item._client_id !== memo._client_id,
      ),
    )
  }

  const handleSave = async () => {
    if (!selectedRuleKey || isSaving) {
      return
    }

    let parsedConfig = {}

    try {
      parsedConfig = JSON.parse(
        form.config_json || '{}',
      )
      setJsonError('')
    } catch (error) {
      setJsonError(
        error?.message ?? 'JSON形式が不正です',
      )
      showErrorToast(
        'config_json のJSON形式が不正です。',
      )
      return
    }

    const updateApi =
      window.electronAPI?.laravel_webAutomationRule_update

    if (typeof updateApi !== 'function') {
      showErrorToast(
        'laravel_webAutomationRule_update がpreloadに公開されていません。',
      )
      return
    }

    const payload = {
      name: form.name.trim(),
      category: form.category.trim() || null,
      action_type: form.action_type.trim(),
      target_url_pattern:
        form.target_url_pattern.trim() || null,
      target_selector:
        form.target_selector.trim() || null,
      parser_type:
        form.parser_type.trim() || null,
      function_name:
        form.function_name.trim() || null,
      config_json: parsedConfig,
      is_active: Boolean(form.is_active),
      sort_order: Number(form.sort_order) || 0,
      version: Math.max(
        1,
        Number(form.version) || 1,
      ),
      memos: memos.map((memo) => {
        const item = {
          memo: String(memo.memo ?? ''),
          sort_order: Number(memo.sort_order) || 0,
          is_active: Boolean(memo.is_active),
        }

        if (memo.id != null) {
          item.id = Number(memo.id)
        }

        return item
      }),
      deleted_memo_ids: deletedMemoIds,
    }

    setIsSaving(true)

    try {
      const result = await updateApi(
        selectedRuleKey,
        payload,
        scope,
      )

      if (!result?.success) {
        throw new Error(
          result?.message ??
            result?.error ??
            '自動化ルールの保存に失敗しました。',
        )
      }

      const returnedRule =
        normalizeSingleData(result)

      const fallbackRule = {
        ...selectedRule,
        ...payload,
        rule_key: selectedRuleKey,
        ...scope,
        memos,
      }
      const savedRule = normalizeRule(
        returnedRule ?? fallbackRule,
      )
      const nextForm = toRuleForm(savedRule)
      const nextMemos = normalizeMemos(savedRule?.memos)

      setForm(nextForm)
      setSavedForm(nextForm)
      setMemos(nextMemos)
      setSavedMemos(nextMemos)
      setDeletedMemoIds([])

      await loadRules(false)

      showSuccessToast(
        `自動化ルール「${selectedRuleKey}」を保存しました。`,
      )
    } catch (error) {
      console.error(
        '[AutomationRulesTab] 保存エラー:',
        error,
      )

      showErrorToast(
        error?.message ??
          '自動化ルールの保存に失敗しました。',
      )
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges =
    JSON.stringify(form) !== JSON.stringify(savedForm) ||
    JSON.stringify(memos) !== JSON.stringify(savedMemos) ||
    deletedMemoIds.length > 0

  return (
    <div>
      <div className="mb-5 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">
              Web自動化
            </h3>

            <p className="mt-1 text-sm text-gray-600">
              app_key / webview_key 単位で Rule と Flow を確認します。
              Ruleはこの画面から更新できます。
            </p>
          </div>

          <button
            type="button"
            onClick={handleScopeReload}
            disabled={
              rulesLoading ||
              flowsLoading ||
              isSaving
            }
            className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            再読み込み
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Field
            label="app_key"
            value={appKey}
            onChange={setAppKey}
            placeholder="hug-banso-navi"
          />

          <Field
            label="webview_key"
            value={webviewKey}
            onChange={setWebviewKey}
            placeholder="*"
          />

          <div className="flex items-end">
            <button
              type="button"
              onClick={handleScopeReload}
              disabled={
                rulesLoading ||
                flowsLoading ||
                isSaving
              }
              className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              このScopeで取得
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-md bg-slate-50 px-3 py-2 font-mono text-xs text-slate-600">
          {scope.app_key} / {scope.webview_key}
        </div>
      </div>

      <div className="mb-5 flex gap-2 border-b border-gray-200">
        <TabButton
          active={activeTab === 'rules'}
          onClick={() => setActiveTab('rules')}
        >
          Rules ({sortedRules.length})
        </TabButton>

        <TabButton
          active={activeTab === 'flows'}
          onClick={() => setActiveTab('flows')}
        >
          Flows ({sortedFlows.length})
        </TabButton>
      </div>

      {activeTab === 'rules' ? (
        <RulesPanel
          rules={sortedRules}
          loading={rulesLoading}
          error={rulesError}
          selectedRuleKey={selectedRuleKey}
          handleSelectRule={handleSelectRule}
          selectedRule={selectedRule}
          form={form}
          updateField={updateField}
          handleConfigJsonChange={handleConfigJsonChange}
          handleFormatJson={handleFormatJson}
          jsonError={jsonError}
          handleReset={handleReset}
          handleSave={handleSave}
          hasChanges={hasChanges}
          isSaving={isSaving}
          memos={memos}
          handleAddMemo={handleAddMemo}
          handleMemoChange={handleMemoChange}
          handleDeleteMemo={handleDeleteMemo}
        />
      ) : (
        <FlowsPanel
          flows={sortedFlows}
          loading={flowsLoading}
          error={flowsError}
          selectedFlowKey={selectedFlowKey}
          setSelectedFlowKey={setSelectedFlowKey}
          selectedFlow={selectedFlow}
          triggerType={triggerType}
          setTriggerType={setTriggerType}
          reload={() => loadFlows(true)}
        />
      )}
    </div>
  )
}

function RulesPanel({
  rules,
  loading,
  error,
  selectedRuleKey,
  handleSelectRule,
  selectedRule,
  form,
  updateField,
  handleConfigJsonChange,
  handleFormatJson,
  jsonError,
  handleReset,
  handleSave,
  hasChanges,
  isSaving,
  memos,
  handleAddMemo,
  handleMemoChange,
  handleDeleteMemo,
}) {
  return (
    <>
      {error && (
        <ErrorBox>{error}</ErrorBox>
      )}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold text-gray-700">
            Rule一覧
          </div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              読み込み中...
            </div>
          ) : rules.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Ruleがありません。
            </div>
          ) : (
            <div className="space-y-2">
              {rules.map((rule) => {
                const selected =
                  rule.rule_key === selectedRuleKey

                return (
                  <button
                    key={`${rule.app_key}:${rule.webview_key}:${rule.rule_key}`}
                    type="button"
                    onClick={() => handleSelectRule(rule)}
                    className={`w-full rounded-md border px-3 py-2 text-left ${
                      selected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-gray-800">
                        {rule.name || rule.rule_key}
                      </span>

                      <span
                        className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                          rule.is_active
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-200 text-gray-600'
                        }`}
                      >
                        {rule.is_active ? 'ON' : 'OFF'}
                      </span>
                    </div>

                    <div className="mt-1 truncate font-mono text-[11px] text-gray-500">
                      {rule.webview_key} / {rule.rule_key}
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                      <span>{rule.action_type || '-'}</span>

                      <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                        メモ {rule.memos?.length ?? 0}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {!selectedRuleKey ? (
            <EmptyBox>
              編集するRuleを選択してください。
            </EmptyBox>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="rule_key"
                  value={form.rule_key}
                  readOnly
                />

                <Field
                  label="名称"
                  value={form.name}
                  onChange={(value) =>
                    updateField('name', value)
                  }
                />

                <Field
                  label="カテゴリ"
                  value={form.category}
                  onChange={(value) =>
                    updateField('category', value)
                  }
                />

                <Field
                  label="action_type"
                  value={form.action_type}
                  onChange={(value) =>
                    updateField('action_type', value)
                  }
                  placeholder="post"
                />

                <Field
                  label="parser_type"
                  value={form.parser_type}
                  onChange={(value) =>
                    updateField('parser_type', value)
                  }
                />

                <Field
                  label="function_name"
                  value={form.function_name}
                  onChange={(value) =>
                    updateField('function_name', value)
                  }
                />
              </div>

              <Field
                label="target_url_pattern"
                value={form.target_url_pattern}
                onChange={(value) =>
                  updateField(
                    'target_url_pattern',
                    value,
                  )
                }
              />

              <Field
                label="target_selector"
                value={form.target_selector}
                onChange={(value) =>
                  updateField(
                    'target_selector',
                    value,
                  )
                }
              />

              <RuleMemosPanel
                memos={memos}
                onAdd={handleAddMemo}
                onChange={handleMemoChange}
                onDelete={handleDeleteMemo}
                disabled={isSaving}
              />

              <JsonEditor
                id="automation-rule-config-json"
                label="config_json"
                value={form.config_json}
                onChange={handleConfigJsonChange}
                onFormat={handleFormatJson}
                error={jsonError}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateField(
                        'is_active',
                        event.target.checked,
                      )
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm font-medium text-gray-700">
                    有効
                  </span>
                </label>

                <NumberField
                  label="並び順"
                  value={form.sort_order}
                  onChange={(value) =>
                    updateField('sort_order', value)
                  }
                  min={0}
                />

                <NumberField
                  label="バージョン"
                  value={form.version}
                  onChange={(value) =>
                    updateField('version', value)
                  }
                  min={1}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                  className="rounded-md bg-gray-600 px-5 py-2.5 font-medium text-white disabled:opacity-50"
                >
                  変更を戻す
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={
                    !hasChanges ||
                    Boolean(jsonError) ||
                    isSaving
                  }
                  className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSaving ? '保存中...' : '保存'}
                </button>

                {hasChanges && (
                  <span className="text-sm text-amber-700">
                    未保存の変更があります
                  </span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  )
}


function RuleMemosPanel({
  memos,
  onAdd,
  onChange,
  onDelete,
  disabled = false,
}) {
  const items = normalizeMemos(memos)

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-gray-800">
            ルールメモ
          </h4>
          <p className="mt-0.5 text-xs text-gray-500">
            メモはこの画面から追加・編集・削除できます。
            無効メモも編集対象として読み込みます。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
            {items.length}件
          </span>

          <button
            type="button"
            onClick={onAdd}
            disabled={disabled}
            className="rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
          >
            メモを追加
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-amber-200 bg-white/70 px-3 py-4 text-center text-sm text-gray-500">
          メモはありません。「メモを追加」から登録できます。
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((memo, index) => (
            <div
              key={memo._client_id ?? memo.id}
              className="rounded-md border border-amber-100 bg-white p-3"
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[11px] text-gray-500">
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 font-semibold text-amber-800">
                    {index + 1}
                  </span>
                  <span>
                    {memo.id == null ? '新規' : `id: ${memo.id}`}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => onDelete(memo)}
                  disabled={disabled}
                  className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                >
                  削除
                </button>
              </div>

              <textarea
                value={memo.memo}
                onChange={(event) =>
                  onChange(
                    memo._client_id,
                    'memo',
                    event.target.value,
                  )
                }
                rows={4}
                disabled={disabled}
                placeholder="メモを入力"
                className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-100 disabled:bg-gray-100"
              />

              <div className="mt-2 grid gap-3 sm:grid-cols-[180px_auto]">
                <NumberField
                  label="並び順"
                  value={memo.sort_order}
                  onChange={(value) =>
                    onChange(
                      memo._client_id,
                      'sort_order',
                      Number(value) || 0,
                    )
                  }
                  min={0}
                />

                <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={memo.is_active}
                    onChange={(event) =>
                      onChange(
                        memo._client_id,
                        'is_active',
                        event.target.checked,
                      )
                    }
                    disabled={disabled}
                    className="h-4 w-4"
                  />
                  <span>有効</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function FlowsPanel({
  flows,
  loading,
  error,
  selectedFlowKey,
  setSelectedFlowKey,
  selectedFlow,
  triggerType,
  setTriggerType,
  reload,
}) {
  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <Field
          label="trigger_type"
          value={triggerType}
          onChange={setTriggerType}
          placeholder="空欄=すべて / manual / dom-ready"
        />

        <button
          type="button"
          onClick={reload}
          disabled={loading}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Flow取得
        </button>

        <div className="text-xs text-gray-500">
          Flow更新APIは未実装のため、この画面では参照のみです。
        </div>
      </div>

      {error && (
        <ErrorBox>{error}</ErrorBox>
      )}

      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">
              読み込み中...
            </div>
          ) : flows.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">
              Flowがありません。
            </div>
          ) : (
            <div className="space-y-2">
              {flows.map((flow) => (
                <button
                  key={`${flow.app_key}:${flow.webview_key}:${flow.flow_key}`}
                  type="button"
                  onClick={() =>
                    setSelectedFlowKey(flow.flow_key)
                  }
                  className={`w-full rounded-md border px-3 py-2 text-left ${
                    flow.flow_key === selectedFlowKey
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {flow.name || flow.flow_key}
                    </span>

                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        flow.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {flow.is_active ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <div className="mt-1 font-mono text-[11px] text-gray-500">
                    {flow.flow_key}
                  </div>

                  <div className="mt-1 text-[11px] text-gray-500">
                    {flow.trigger_type || '-'} / {flow.steps?.length ?? 0} steps
                  </div>
                </button>
              ))}
            </div>
          )}
        </aside>

        <section>
          {!selectedFlow ? (
            <EmptyBox>
              確認するFlowを選択してください。
            </EmptyBox>
          ) : (
            <FlowDetail flow={selectedFlow} />
          )}
        </section>
      </div>
    </>
  )
}

function FlowDetail({ flow }) {
  const steps = [...(flow.steps ?? [])].sort(
    (a, b) =>
      Number(a.step_order ?? 0) -
      Number(b.step_order ?? 0),
  )

  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-2">
        <ReadOnlyValue
          label="flow_key"
          value={flow.flow_key}
        />
        <ReadOnlyValue
          label="名称"
          value={flow.name}
        />
        <ReadOnlyValue
          label="app_key"
          value={flow.app_key}
        />
        <ReadOnlyValue
          label="webview_key"
          value={flow.webview_key}
        />
        <ReadOnlyValue
          label="trigger_type"
          value={flow.trigger_type}
        />
        <ReadOnlyValue
          label="version"
          value={flow.version}
        />
      </div>

      <ReadOnlyValue
        label="target_url_pattern"
        value={flow.target_url_pattern}
      />

      <div>
        <div className="mb-2 text-sm font-semibold text-gray-700">
          config_json
        </div>
        <pre className="max-h-72 overflow-auto rounded-md border border-gray-200 bg-slate-950 p-3 text-xs leading-5 text-slate-100">
          {stringifyJson(flow.config_json)}
        </pre>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-gray-700">
            Steps
          </h4>
          <span className="text-xs text-gray-500">
            {steps.length}件
          </span>
        </div>

        <div className="space-y-3">
          {steps.length === 0 ? (
            <EmptyBox>
              Stepが登録されていません。
            </EmptyBox>
          ) : (
            steps.map((step) => (
              <div
                key={step.id ?? `${step.step_order}:${step.step_key}`}
                className="rounded-lg border border-gray-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded bg-slate-800 px-2 py-1 font-mono text-xs font-bold text-white">
                    {step.step_order}
                  </span>

                  <span className="font-semibold text-gray-800">
                    {step.name || step.step_key || 'step'}
                  </span>

                  <span className="rounded bg-blue-50 px-2 py-1 text-xs text-blue-700">
                    {step.step_type}
                  </span>

                  {!step.is_active && (
                    <span className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-600">
                      OFF
                    </span>
                  )}
                </div>

                {step.rule && (
                  <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm">
                    <div>
                      <strong>Rule:</strong>{' '}
                      <span className="font-mono">
                        {step.rule.rule_key}
                      </span>
                    </div>
                    <div className="mt-1 text-xs text-gray-600">
                      action_type: {step.rule.action_type || '-'}
                    </div>

                    {Array.isArray(step.rule.memos) &&
                      step.rule.memos.length > 0 && (
                        <div className="mt-2 space-y-1 border-t border-gray-200 pt-2">
                          {normalizeMemos(step.rule.memos).map((memo) => (
                            <div
                              key={memo.id}
                              className="whitespace-pre-wrap text-xs text-amber-800"
                            >
                              ・{memo.memo}
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                )}

                <div className="mt-3 grid gap-3 lg:grid-cols-2">
                  <JsonPreview
                    label="input_json"
                    value={step.input_json}
                  />
                  <JsonPreview
                    label="config_json"
                    value={step.config_json}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  children,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-b-2 px-4 py-2 text-sm font-semibold ${
        active
          ? 'border-blue-600 text-blue-700'
          : 'border-transparent text-gray-500 hover:text-gray-700'
      }`}
    >
      {children}
    </button>
  )
}

function Field({
  label,
  value,
  onChange,
  placeholder = '',
  readOnly = false,
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1 block text-sm font-semibold text-gray-700">
        {label}
      </span>

      <input
        type="text"
        value={value ?? ''}
        onChange={(event) =>
          onChange?.(event.target.value)
        }
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          readOnly
            ? 'bg-gray-100 text-gray-600'
            : 'bg-white text-gray-900'
        }`}
      />
    </label>
  )
}

function NumberField({
  label,
  value,
  onChange,
  min,
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">
        {label}
      </span>

      <input
        type="number"
        value={value}
        min={min}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </label>
  )
}

function JsonEditor({
  id,
  label,
  value,
  onChange,
  onFormat,
  error,
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="text-sm font-semibold text-gray-700"
        >
          {label}
        </label>

        <button
          type="button"
          onClick={onFormat}
          className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          JSON整形
        </button>
      </div>

      <textarea
        id={id}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={18}
        spellCheck={false}
        className={`w-full resize-y rounded-md border px-3 py-2 font-mono text-sm leading-6 text-gray-900 focus:outline-none focus:ring-2 ${
          error
            ? 'border-red-400 focus:ring-red-100'
            : 'border-gray-300 focus:border-blue-600 focus:ring-blue-200'
        }`}
      />

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}

function ReadOnlyValue({
  label,
  value,
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 text-sm font-semibold text-gray-700">
        {label}
      </div>
      <div className="min-h-10 break-all rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
        {String(value ?? '') || '-'}
      </div>
    </div>
  )
}

function JsonPreview({
  label,
  value,
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-gray-600">
        {label}
      </div>
      <pre className="max-h-52 overflow-auto rounded-md bg-slate-950 p-3 text-[11px] leading-5 text-slate-100">
        {stringifyJson(value)}
      </pre>
    </div>
  )
}

function ErrorBox({ children }) {
  return (
    <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      {children}
    </div>
  )
}

function EmptyBox({ children }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-10 text-center text-gray-500">
      {children}
    </div>
  )
}
