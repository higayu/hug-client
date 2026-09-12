import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'

const EMPTY_FORM = {
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

function toForm(rule) {
  if (!rule) {
    return { ...EMPTY_FORM }
  }

  return {
    rule_key: rule.rule_key ?? '',
    name: rule.name ?? '',
    category: rule.category ?? '',
    action_type: rule.action_type ?? '',
    target_url_pattern: rule.target_url_pattern ?? '',
    target_selector: rule.target_selector ?? '',
    parser_type: rule.parser_type ?? '',
    function_name: rule.function_name ?? '',
    config_json: JSON.stringify(
      rule.config_json ?? {},
      null,
      2,
    ),
    is_active: Boolean(rule.is_active),
    sort_order: Number(rule.sort_order ?? 0),
    version: Number(rule.version ?? 1),
  }
}

function normalizeRule(rule) {
  if (!rule?.rule_key) {
    return null
  }

  return {
    ...rule,
    rule_key: String(rule.rule_key),
  }
}

export default function AutomationRulesTab() {
  const {
    webAutomationRules,
    webAutomationRulesLoading,
    webAutomationRulesError,
    loadWebAutomationRules,
    loadWebAutomationRule,
  } = useAppState()

  const {
    showSuccessToast,
    showErrorToast,
  } = useToast()

  const [selectedRuleKey, setSelectedRuleKey] = useState('')
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [savedForm, setSavedForm] = useState({ ...EMPTY_FORM })
  const [isSaving, setIsSaving] = useState(false)
  const [jsonError, setJsonError] = useState('')

  const rules = useMemo(() => {
    const items = Array.isArray(webAutomationRules)
      ? webAutomationRules
      : []

    return items
      .map(normalizeRule)
      .filter(Boolean)
      .sort((a, b) => {
        const orderDiff =
          Number(a.sort_order ?? 0) -
          Number(b.sort_order ?? 0)

        if (orderDiff !== 0) {
          return orderDiff
        }

        return String(a.rule_key).localeCompare(
          String(b.rule_key),
          'ja',
        )
      })
  }, [webAutomationRules])

  const selectedRule = useMemo(
    () =>
      rules.find(
        (rule) => rule.rule_key === selectedRuleKey,
      ) ?? null,
    [rules, selectedRuleKey],
  )

  const applyRuleToForm = useCallback((rule) => {
    const nextForm = toForm(rule)
    setForm(nextForm)
    setSavedForm(nextForm)
    setJsonError('')
  }, [])

  const reloadRules = useCallback(
    async (showToast = false) => {
      const result = await loadWebAutomationRules()

      if (!result?.success) {
        showErrorToast(
          result?.error ??
            '自動化ルールの取得に失敗しました。',
        )
        return
      }

      const items = Array.isArray(result.data)
        ? result.data
        : []

      const nextSelectedKey =
        items.some(
          (rule) =>
            String(rule?.rule_key) ===
            String(selectedRuleKey),
        )
          ? selectedRuleKey
          : String(items[0]?.rule_key ?? '')

      setSelectedRuleKey(nextSelectedKey)

      const nextRule =
        items.find(
          (rule) =>
            String(rule?.rule_key) ===
            String(nextSelectedKey),
        ) ?? null

      applyRuleToForm(nextRule)

      if (showToast) {
        showSuccessToast(
          '自動化ルールを再読み込みしました。',
        )
      }
    },
    [
      applyRuleToForm,
      loadWebAutomationRules,
      selectedRuleKey,
      showErrorToast,
      showSuccessToast,
    ],
  )

  useEffect(() => {
    reloadRules()
  }, [])

  useEffect(() => {
    if (!selectedRule) {
      if (!selectedRuleKey && rules[0]) {
        setSelectedRuleKey(rules[0].rule_key)
        applyRuleToForm(rules[0])
      }
      return
    }

    applyRuleToForm(selectedRule)
  }, [
    selectedRuleKey,
    selectedRule,
    rules,
    applyRuleToForm,
  ])

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
      setJsonError(error?.message ?? 'JSON形式が不正です')
    }
  }

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(form.config_json || '{}')
      const formatted = JSON.stringify(parsed, null, 2)

      updateField('config_json', formatted)
      setJsonError('')
    } catch (error) {
      setJsonError(error?.message ?? 'JSON形式が不正です')
      showErrorToast('config_json のJSON形式が不正です。')
    }
  }

  const handleReset = () => {
    setForm({ ...savedForm })
    setJsonError('')
  }

  const handleSave = async () => {
    if (!selectedRuleKey || isSaving) {
      return
    }

    let parsedConfig = {}

    try {
      parsedConfig = JSON.parse(form.config_json || '{}')
      setJsonError('')
    } catch (error) {
      setJsonError(error?.message ?? 'JSON形式が不正です')
      showErrorToast('config_json のJSON形式が不正です。')
      return
    }

    const updateApi =
      window.electronAPI?.laravel_webAutomationRule_update

    if (typeof updateApi !== 'function') {
      showErrorToast(
        '更新APIがまだpreloadに公開されていません。laravel_webAutomationRule_update の追加が必要です。',
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
      version: Math.max(1, Number(form.version) || 1),
    }

    setIsSaving(true)

    try {
      const result = await updateApi(
        selectedRuleKey,
        payload,
      )

      if (!result?.success) {
        throw new Error(
          result?.message ??
            result?.error ??
            '自動化ルールの保存に失敗しました。',
        )
      }

      await loadWebAutomationRule(
        selectedRuleKey,
        { force: true },
      )

      const nextForm = toForm(
        result?.data ?? {
          ...selectedRule,
          ...payload,
          rule_key: selectedRuleKey,
        },
      )

      setForm(nextForm)
      setSavedForm(nextForm)

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
    JSON.stringify(form) !== JSON.stringify(savedForm)

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-gray-200 pb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-700">
            Web自動化ルール
          </h3>

          <p className="mt-1 text-sm text-gray-600">
            WebViewの自動操作ルールを編集します。変更内容は保存後に利用者側へ反映できます。
          </p>
        </div>

        <button
          type="button"
          onClick={() => reloadRules(true)}
          disabled={webAutomationRulesLoading || isSaving}
          className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          再読み込み
        </button>
      </div>

      {webAutomationRulesError && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {webAutomationRulesError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label
            htmlFor="automation-rule-select"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            編集するルール
          </label>

          <select
            id="automation-rule-select"
            value={selectedRuleKey}
            onChange={(event) => {
              const nextKey = event.target.value
              setSelectedRuleKey(nextKey)

              const rule = rules.find(
                (item) => item.rule_key === nextKey,
              )

              applyRuleToForm(rule)
            }}
            disabled={webAutomationRulesLoading || rules.length === 0}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
          >
            {rules.length === 0 && (
              <option value="">ルールがありません</option>
            )}

            {rules.map((rule) => (
              <option
                key={rule.rule_key}
                value={rule.rule_key}
              >
                {rule.name || rule.rule_key}
              </option>
            ))}
          </select>

          <div className="mt-4 space-y-2">
            {rules.map((rule) => {
              const isSelected =
                selectedRuleKey === rule.rule_key

              return (
                <button
                  key={rule.rule_key}
                  type="button"
                  onClick={() => {
                    setSelectedRuleKey(rule.rule_key)
                    applyRuleToForm(rule)
                  }}
                  className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 text-blue-800'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-semibold">
                      {rule.name || rule.rule_key}
                    </span>

                    <span
                      className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        rule.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {rule.is_active ? 'ON' : 'OFF'}
                    </span>
                  </div>

                  <div className="mt-1 truncate text-xs text-gray-500">
                    {rule.rule_key}
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="min-w-0">
          {!selectedRuleKey ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 px-5 py-10 text-center text-gray-500">
              編集するルールを選択してください。
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field
                  label="ルールキー"
                  value={form.rule_key}
                  readOnly
                />

                <Field
                  label="名称"
                  value={form.name}
                  onChange={(value) => updateField('name', value)}
                />

                <Field
                  label="カテゴリ"
                  value={form.category}
                  onChange={(value) => updateField('category', value)}
                  placeholder="attendance"
                />

                <Field
                  label="アクション種別"
                  value={form.action_type}
                  onChange={(value) => updateField('action_type', value)}
                  placeholder="post"
                />

                <Field
                  label="パーサー種別"
                  value={form.parser_type}
                  onChange={(value) => updateField('parser_type', value)}
                  placeholder="function-arguments"
                />

                <Field
                  label="関数名"
                  value={form.function_name}
                  onChange={(value) => updateField('function_name', value)}
                  placeholder="sendEnterMail"
                />
              </div>

              <Field
                label="対象URLパターン"
                value={form.target_url_pattern}
                onChange={(value) =>
                  updateField('target_url_pattern', value)
                }
              />

              <Field
                label="対象セレクタ"
                value={form.target_selector}
                onChange={(value) =>
                  updateField('target_selector', value)
                }
              />

              <div>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <label
                    htmlFor="automation-rule-config-json"
                    className="text-sm font-semibold text-gray-700"
                  >
                    config_json
                  </label>

                  <button
                    type="button"
                    onClick={handleFormatJson}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                  >
                    JSON整形
                  </button>
                </div>

                <textarea
                  id="automation-rule-config-json"
                  value={form.config_json}
                  onChange={(event) =>
                    handleConfigJsonChange(event.target.value)
                  }
                  rows={18}
                  spellCheck={false}
                  className={`w-full resize-y rounded-md border px-3 py-2 font-mono text-sm leading-6 text-gray-900 focus:outline-none focus:ring-2 ${
                    jsonError
                      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
                      : 'border-gray-300 focus:border-blue-600 focus:ring-blue-200'
                  }`}
                />

                {jsonError && (
                  <p className="mt-1 text-xs text-red-600">
                    {jsonError}
                  </p>
                )}
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <label className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={form.is_active}
                    onChange={(event) =>
                      updateField('is_active', event.target.checked)
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
                  onChange={(value) => updateField('sort_order', value)}
                  min={0}
                />

                <NumberField
                  label="バージョン"
                  value={form.version}
                  onChange={(value) => updateField('version', value)}
                  min={1}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={!hasChanges || isSaving}
                  className="rounded-md bg-gray-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
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
    </div>
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
        onChange={(event) => onChange?.(event.target.value)}
        placeholder={placeholder}
        readOnly={readOnly}
        className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 ${
          readOnly ? 'bg-gray-100 text-gray-600' : 'bg-white'
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
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      />
    </label>
  )
}
