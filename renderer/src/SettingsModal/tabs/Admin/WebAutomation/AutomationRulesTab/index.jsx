import { useCallback, useEffect, useMemo, useState } from 'react'

import { useToast } from '@/provider/ToastProvider/ToastContext'

const DEFAULT_APP_KEY = 'hug-banso-navi'

const EMPTY_FLOW = {
  id: null,
  app_key: DEFAULT_APP_KEY,
  flow_key: '',
  name: '',
  description: '',
  entry_file: 'index.js',
  entry_export: 'default',
  engine_version: 1,
  config_json: '{}',
  input_schema_json: '{}',
  output_schema_json: '{}',
  timeout_ms: 30000,
  version: 1,
  status: 'draft',
  published_at: null,
}

function normalizeArray(result) {
  if (Array.isArray(result?.data)) return result.data
  if (Array.isArray(result?.data?.data)) return result.data.data
  if (Array.isArray(result)) return result
  return []
}

function normalizeSingle(result) {
  if (result?.data?.data && !Array.isArray(result.data.data)) {
    return result.data.data
  }
  return result?.data ?? null
}

function stringifyJson(value) {
  if (typeof value === 'string') {
    try {
      return JSON.stringify(JSON.parse(value), null, 2)
    } catch {
      return value || '{}'
    }
  }

  try {
    return JSON.stringify(value ?? {}, null, 2)
  } catch {
    return '{}'
  }
}

function normalizeFlow(flow) {
  if (!flow?.flow_key) return null

  return {
    ...EMPTY_FLOW,
    ...flow,
    id: flow.id == null ? null : Number(flow.id),
    app_key: String(flow.app_key ?? DEFAULT_APP_KEY),
    flow_key: String(flow.flow_key ?? ''),
    name: String(flow.name ?? ''),
    description: String(flow.description ?? ''),
    entry_file: String(flow.entry_file ?? 'index.js'),
    entry_export: String(flow.entry_export ?? 'default'),
    engine_version: Number(flow.engine_version ?? 1),
    config_json: stringifyJson(flow.config_json),
    input_schema_json: stringifyJson(flow.input_schema_json),
    output_schema_json: stringifyJson(flow.output_schema_json),
    timeout_ms: Number(flow.timeout_ms ?? 30000),
    version: Number(flow.version ?? 1),
    status: String(flow.status ?? 'draft'),
    published_at: flow.published_at ?? null,
    files: Array.isArray(flow.files) ? flow.files : [],
    memos: Array.isArray(flow.memos) ? flow.memos : [],
  }
}

function normalizeFile(file, index = 0) {
  if (!file) return null
  const id = file.id == null ? null : Number(file.id)

  return {
    ...file,
    id,
    _client_id: file._client_id ?? (id == null ? `new-file-${index}` : `file-${id}`),
    file_path: String(file.file_path ?? ''),
    file_type: String(file.file_type ?? 'javascript'),
    module_type: String(file.module_type ?? 'commonjs'),
    source_text: String(file.source_text ?? ''),
    config_json: stringifyJson(file.config_json),
    content_hash: String(file.content_hash ?? ''),
    is_active: Boolean(file.is_active ?? true),
  }
}

function normalizeMemo(memo, index = 0) {
  if (!memo) return null
  const id = memo.id == null ? null : Number(memo.id)

  return {
    ...memo,
    id,
    _client_id: memo._client_id ?? (id == null ? `new-memo-${index}` : `memo-${id}`),
    memo: String(memo.memo ?? ''),
    sort_order: Number(memo.sort_order ?? 0),
    is_active: Boolean(memo.is_active ?? true),
  }
}

function getApi(...names) {
  for (const name of names) {
    const fn = window.electronAPI?.[name]
    if (typeof fn === 'function') return fn
  }
  return null
}

export default function AutomationRulesTab() {
  const { showSuccessToast, showErrorToast } = useToast()

  const [appKey, setAppKey] = useState(DEFAULT_APP_KEY)
  const [activeTab, setActiveTab] = useState('flows')

  const [flows, setFlows] = useState([])
  const [selectedFlowId, setSelectedFlowId] = useState(null)
  const [flowForm, setFlowForm] = useState({ ...EMPTY_FLOW })
  const [savedFlowForm, setSavedFlowForm] = useState({ ...EMPTY_FLOW })

  const [files, setFiles] = useState([])
  const [savedFiles, setSavedFiles] = useState([])
  const [deletedFileIds, setDeletedFileIds] = useState([])

  const [memos, setMemos] = useState([])
  const [savedMemos, setSavedMemos] = useState([])
  const [deletedMemoIds, setDeletedMemoIds] = useState([])

  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const selectedFlow = useMemo(
    () => flows.find((flow) => Number(flow.id) === Number(selectedFlowId)) ?? null,
    [flows, selectedFlowId],
  )

  const sortedFlows = useMemo(
    () => [...flows].sort((a, b) => {
      const keyDiff = String(a.flow_key).localeCompare(String(b.flow_key), 'ja')
      if (keyDiff !== 0) return keyDiff
      return Number(b.version ?? 1) - Number(a.version ?? 1)
    }),
    [flows],
  )

  const applyFlow = useCallback((flow) => {
    const normalized = normalizeFlow(flow) ?? { ...EMPTY_FLOW }
    setFlowForm(normalized)
    setSavedFlowForm(normalized)

    const nextFiles = (normalized.files ?? [])
      .map(normalizeFile)
      .filter(Boolean)
    setFiles(nextFiles)
    setSavedFiles(nextFiles)
    setDeletedFileIds([])

    const nextMemos = (normalized.memos ?? [])
      .map(normalizeMemo)
      .filter(Boolean)
      .sort((a, b) => a.sort_order - b.sort_order)
    setMemos(nextMemos)
    setSavedMemos(nextMemos)
    setDeletedMemoIds([])
  }, [])

  const loadFlowDetail = useCallback(async (flow) => {
    if (!flow) return null

    const api = getApi(
      'laravel_webAutomationV2Flow_get',
      'webAutomationV2_adminFlowGet',
    )

    if (!api) return flow

    const result = await api(flow.id ?? flow.flow_key, {
      app_key: appKey.trim() || DEFAULT_APP_KEY,
      version: flow.version,
      include_files: true,
      include_memos: true,
    })

    if (!result?.success) {
      throw new Error(result?.message ?? result?.error ?? 'V2 Flow詳細の取得に失敗しました。')
    }

    return normalizeSingle(result) ?? flow
  }, [appKey])

  const loadFlows = useCallback(async (showToast = false) => {
    const api = getApi(
      'laravel_webAutomationV2Flows_getAll',
      'webAutomationV2_adminFlowsGetAll',
    )

    if (!api) {
      const message = 'V2管理用Flow一覧APIがpreloadに公開されていません。'
      setError(message)
      showErrorToast(message)
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await api({ app_key: appKey.trim() || DEFAULT_APP_KEY })
      if (!result?.success) {
        throw new Error(result?.message ?? result?.error ?? 'V2 Flow一覧の取得に失敗しました。')
      }

      const items = normalizeArray(result).map(normalizeFlow).filter(Boolean)
      setFlows(items)

      const current = items.find((flow) => Number(flow.id) === Number(selectedFlowId))
      const next = current ?? items[0] ?? null
      setSelectedFlowId(next?.id ?? null)

      if (next) {
        applyFlow(await loadFlowDetail(next))
      } else {
        applyFlow(null)
      }

      if (showToast) {
        showSuccessToast(`V2 Flowを再読み込みしました。(${items.length}件)`)
      }
    } catch (e) {
      console.error('[WebAutomationV2Admin] Flow取得エラー:', e)
      const message = e?.message ?? 'V2 Flow一覧の取得に失敗しました。'
      setError(message)
      showErrorToast(message)
    } finally {
      setLoading(false)
    }
  }, [appKey, selectedFlowId, applyFlow, loadFlowDetail, showErrorToast, showSuccessToast])

  const loadLogs = useCallback(async () => {
    const api = getApi(
      'laravel_webAutomationV2ExecutionLogs_getAll',
      'webAutomationV2_adminExecutionLogsGetAll',
    )

    if (!api) {
      setLogs([])
      return
    }

    try {
      const result = await api({
        app_key: appKey.trim() || DEFAULT_APP_KEY,
        flow_key: selectedFlow?.flow_key || undefined,
        limit: 100,
      })
      if (result?.success) setLogs(normalizeArray(result))
    } catch (e) {
      console.warn('[WebAutomationV2Admin] Log取得エラー:', e)
    }
  }, [appKey, selectedFlow?.flow_key])

  useEffect(() => {
    loadFlows()
  }, [])

  useEffect(() => {
    if (activeTab === 'logs') loadLogs()
  }, [activeTab, loadLogs])

  const selectFlow = async (flow) => {
    setSelectedFlowId(flow.id)
    try {
      applyFlow(await loadFlowDetail(flow))
    } catch (e) {
      showErrorToast(e?.message ?? 'Flow詳細の取得に失敗しました。')
      applyFlow(flow)
    }
  }

  const updateFlowField = (key, value) => {
    setFlowForm((prev) => ({ ...prev, [key]: value }))
  }

  const addFile = () => {
    setFiles((prev) => [
      ...prev,
      normalizeFile({
        _client_id: `new-file-${Date.now()}`,
        file_path: '',
        file_type: 'javascript',
        module_type: 'commonjs',
        source_text: '',
        config_json: '{}',
        is_active: true,
      }, prev.length),
    ])
  }

  const updateFile = (clientId, key, value) => {
    setFiles((prev) => prev.map((file) =>
      file._client_id === clientId ? { ...file, [key]: value } : file,
    ))
  }

  const deleteFile = (file) => {
    if (file.id != null) {
      setDeletedFileIds((prev) => prev.includes(file.id) ? prev : [...prev, file.id])
    }
    setFiles((prev) => prev.filter((item) => item._client_id !== file._client_id))
  }

  const addMemo = () => {
    setMemos((prev) => [
      ...prev,
      normalizeMemo({
        _client_id: `new-memo-${Date.now()}`,
        memo: '',
        sort_order: prev.length,
        is_active: true,
      }, prev.length),
    ])
  }

  const updateMemo = (clientId, key, value) => {
    setMemos((prev) => prev.map((memo) =>
      memo._client_id === clientId ? { ...memo, [key]: value } : memo,
    ))
  }

  const deleteMemo = (memo) => {
    if (memo.id != null) {
      setDeletedMemoIds((prev) => prev.includes(memo.id) ? prev : [...prev, memo.id])
    }
    setMemos((prev) => prev.filter((item) => item._client_id !== memo._client_id))
  }

  const reset = () => {
    setFlowForm({ ...savedFlowForm })
    setFiles(savedFiles.map((file) => ({ ...file })))
    setMemos(savedMemos.map((memo) => ({ ...memo })))
    setDeletedFileIds([])
    setDeletedMemoIds([])
  }

  const hasChanges =
    JSON.stringify(flowForm) !== JSON.stringify(savedFlowForm) ||
    JSON.stringify(files) !== JSON.stringify(savedFiles) ||
    JSON.stringify(memos) !== JSON.stringify(savedMemos) ||
    deletedFileIds.length > 0 ||
    deletedMemoIds.length > 0

  const save = async () => {
    if (!selectedFlow || saving) return

    const api = getApi(
      'laravel_webAutomationV2Flow_update',
      'webAutomationV2_adminFlowUpdate',
    )

    if (!api) {
      showErrorToast('V2管理用Flow更新APIがpreloadに公開されていません。')
      return
    }

    let configJson
    let inputSchemaJson
    let outputSchemaJson

    try {
      configJson = JSON.parse(flowForm.config_json || '{}')
      inputSchemaJson = JSON.parse(flowForm.input_schema_json || '{}')
      outputSchemaJson = JSON.parse(flowForm.output_schema_json || '{}')
    } catch (e) {
      showErrorToast(`JSON形式が不正です: ${e.message}`)
      return
    }

    for (const file of files) {
      try {
        JSON.parse(file.config_json || '{}')
      } catch (e) {
        showErrorToast(`${file.file_path || '新規ファイル'} の config_json が不正です。`)
        return
      }
    }

    const payload = {
      name: flowForm.name.trim(),
      description: flowForm.description.trim() || null,
      entry_file: flowForm.entry_file.trim(),
      entry_export: flowForm.entry_export.trim() || 'default',
      engine_version: Math.max(1, Number(flowForm.engine_version) || 1),
      config_json: configJson,
      input_schema_json: inputSchemaJson,
      output_schema_json: outputSchemaJson,
      timeout_ms: Math.max(1, Number(flowForm.timeout_ms) || 30000),
      version: Math.max(1, Number(flowForm.version) || 1),
      status: flowForm.status,
      files: files.map((file) => ({
        ...(file.id != null ? { id: file.id } : {}),
        file_path: file.file_path.trim(),
        file_type: file.file_type || 'javascript',
        module_type: file.module_type || 'commonjs',
        source_text: file.source_text,
        config_json: JSON.parse(file.config_json || '{}'),
        is_active: Boolean(file.is_active),
      })),
      deleted_file_ids: deletedFileIds,
      memos: memos.map((memo) => ({
        ...(memo.id != null ? { id: memo.id } : {}),
        memo: memo.memo,
        sort_order: Number(memo.sort_order) || 0,
        is_active: Boolean(memo.is_active),
      })),
      deleted_memo_ids: deletedMemoIds,
    }

    setSaving(true)
    try {
      const result = await api(selectedFlow.id, payload)
      if (!result?.success) {
        throw new Error(result?.message ?? result?.error ?? 'V2 Flowの保存に失敗しました。')
      }

      const returned = normalizeSingle(result)
      if (returned) applyFlow(returned)
      await loadFlows(false)
      showSuccessToast(`V2 Flow「${flowForm.flow_key}」を保存しました。`)
    } catch (e) {
      console.error('[WebAutomationV2Admin] 保存エラー:', e)
      showErrorToast(e?.message ?? 'V2 Flowの保存に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-5 border-b border-gray-200 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-700">Web自動化 V2</h3>
            <p className="mt-1 text-sm text-gray-600">
              web_automation_flows_v2 / files_v2 / flow_memos_v2 / execution_logs_v2 を管理します。
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadFlows(true)}
            disabled={loading || saving}
            className="rounded-md bg-gray-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            再読み込み
          </button>
        </div>

        <div className="mt-4 max-w-md">
          <Field label="app_key" value={appKey} onChange={setAppKey} />
        </div>
      </div>

      {error && <ErrorBox>{error}</ErrorBox>}

      <div className="grid gap-5 lg:grid-cols-[310px_minmax(0,1fr)]">
        <aside className="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <div className="mb-2 text-sm font-semibold text-gray-700">V2 Flow一覧</div>

          {loading ? (
            <div className="py-8 text-center text-sm text-gray-500">読み込み中...</div>
          ) : sortedFlows.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-500">Flowがありません。</div>
          ) : (
            <div className="space-y-2">
              {sortedFlows.map((flow) => {
                const selected = Number(flow.id) === Number(selectedFlowId)
                return (
                  <button
                    key={flow.id ?? `${flow.flow_key}:${flow.version}`}
                    type="button"
                    onClick={() => selectFlow(flow)}
                    className={`w-full rounded-md border px-3 py-2 text-left ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-100'}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-gray-800">
                        {flow.name || flow.flow_key}
                      </span>
                      <StatusBadge status={flow.status} />
                    </div>
                    <div className="mt-1 truncate font-mono text-[11px] text-gray-500">{flow.flow_key}</div>
                    <div className="mt-1 flex gap-2 text-[11px] text-gray-500">
                      <span>v{flow.version}</span>
                      <span>{flow.files?.length ?? 0} files</span>
                      <span>{flow.memos?.length ?? 0} memos</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </aside>

        <section className="min-w-0">
          {!selectedFlow ? (
            <EmptyBox>編集するV2 Flowを選択してください。</EmptyBox>
          ) : (
            <>
              <div className="mb-4 flex gap-2 border-b border-gray-200">
                {[
                  ['flows', 'Flow'],
                  ['files', `Files (${files.length})`],
                  ['memos', `Memos (${memos.length})`],
                  ['logs', 'Logs'],
                ].map(([id, label]) => (
                  <TabButton key={id} active={activeTab === id} onClick={() => setActiveTab(id)}>
                    {label}
                  </TabButton>
                ))}
              </div>

              {activeTab === 'flows' && (
                <FlowEditor flow={flowForm} update={updateFlowField} />
              )}

              {activeTab === 'files' && (
                <FilesEditor files={files} onAdd={addFile} onChange={updateFile} onDelete={deleteFile} disabled={saving} />
              )}

              {activeTab === 'memos' && (
                <MemosEditor memos={memos} onAdd={addMemo} onChange={updateMemo} onDelete={deleteMemo} disabled={saving} />
              )}

              {activeTab === 'logs' && (
                <LogsPanel logs={logs} onReload={loadLogs} />
              )}

              {activeTab !== 'logs' && (
                <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-gray-200 pt-4">
                  <button type="button" onClick={reset} disabled={!hasChanges || saving} className="rounded-md bg-gray-600 px-5 py-2.5 font-medium text-white disabled:opacity-50">
                    変更を戻す
                  </button>
                  <button type="button" onClick={save} disabled={!hasChanges || saving} className="rounded-md bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700 disabled:opacity-50">
                    {saving ? '保存中...' : '保存'}
                  </button>
                  {hasChanges && <span className="text-sm text-amber-700">未保存の変更があります</span>}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

function FlowEditor({ flow, update }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="flow_key" value={flow.flow_key} readOnly />
        <Field label="名称" value={flow.name} onChange={(v) => update('name', v)} />
        <Field label="entry_file" value={flow.entry_file} onChange={(v) => update('entry_file', v)} />
        <Field label="entry_export" value={flow.entry_export} onChange={(v) => update('entry_export', v)} />
        <NumberField label="engine_version" value={flow.engine_version} onChange={(v) => update('engine_version', v)} min={1} />
        <NumberField label="timeout_ms" value={flow.timeout_ms} onChange={(v) => update('timeout_ms', v)} min={1} />
        <NumberField label="version" value={flow.version} onChange={(v) => update('version', v)} min={1} />
        <SelectField label="status" value={flow.status} onChange={(v) => update('status', v)} options={['draft', 'published', 'disabled']} />
      </div>

      <TextArea label="description" value={flow.description} onChange={(v) => update('description', v)} rows={3} />
      <JsonEditor label="config_json" value={flow.config_json} onChange={(v) => update('config_json', v)} />
      <JsonEditor label="input_schema_json" value={flow.input_schema_json} onChange={(v) => update('input_schema_json', v)} />
      <JsonEditor label="output_schema_json" value={flow.output_schema_json} onChange={(v) => update('output_schema_json', v)} />
    </div>
  )
}

function FilesEditor({ files, onAdd, onChange, onDelete, disabled }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800">仮想JSファイル</h4>
          <p className="text-xs text-gray-500">web_automation_files_v2。物理ファイルには書き出さず、moduleLoaderがメモリ上で実行します。</p>
        </div>
        <button type="button" onClick={onAdd} disabled={disabled} className="rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">ファイル追加</button>
      </div>

      {files.length === 0 ? <EmptyBox>ファイルがありません。</EmptyBox> : files.map((file) => (
        <div key={file._client_id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="mb-3 grid gap-3 md:grid-cols-2">
            <Field label="file_path" value={file.file_path} onChange={(v) => onChange(file._client_id, 'file_path', v)} />
            <SelectField label="module_type" value={file.module_type} onChange={(v) => onChange(file._client_id, 'module_type', v)} options={['commonjs', 'module', 'raw']} />
          </div>

          <CodeEditor label="source_text" value={file.source_text} onChange={(v) => onChange(file._client_id, 'source_text', v)} />
          <JsonEditor label="config_json" value={file.config_json} onChange={(v) => onChange(file._client_id, 'config_json', v)} />

          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={file.is_active} onChange={(e) => onChange(file._client_id, 'is_active', e.target.checked)} />
              有効
            </label>
            <div className="flex items-center gap-3">
              {file.content_hash && <span className="max-w-[280px] truncate font-mono text-[10px] text-gray-400">SHA-256: {file.content_hash}</span>}
              <button type="button" onClick={() => onDelete(file)} disabled={disabled} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 disabled:opacity-50">削除</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function MemosEditor({ memos, onAdd, onChange, onDelete, disabled }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800">Flowメモ</h4>
          <p className="text-xs text-gray-500">web_automation_flow_memos_v2。Flowのversion単位で管理します。</p>
        </div>
        <button type="button" onClick={onAdd} disabled={disabled} className="rounded-md bg-amber-600 px-3 py-2 text-sm font-medium text-white disabled:opacity-50">メモ追加</button>
      </div>

      {memos.length === 0 ? <EmptyBox>メモがありません。</EmptyBox> : memos.map((memo, index) => (
        <div key={memo._client_id} className="rounded-lg border border-amber-200 bg-amber-50/40 p-4">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">#{index + 1}</span>
            <button type="button" onClick={() => onDelete(memo)} disabled={disabled} className="rounded-md border border-red-200 bg-red-50 px-3 py-1 text-xs text-red-700">削除</button>
          </div>
          <TextArea label="memo" value={memo.memo} onChange={(v) => onChange(memo._client_id, 'memo', v)} rows={4} />
          <div className="mt-3 grid gap-3 sm:grid-cols-[180px_auto]">
            <NumberField label="sort_order" value={memo.sort_order} onChange={(v) => onChange(memo._client_id, 'sort_order', v)} min={0} />
            <label className="flex items-end gap-2 pb-2 text-sm text-gray-700">
              <input type="checkbox" checked={memo.is_active} onChange={(e) => onChange(memo._client_id, 'is_active', e.target.checked)} />
              有効
            </label>
          </div>
        </div>
      ))}
    </div>
  )
}

function LogsPanel({ logs, onReload }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h4 className="font-semibold text-gray-800">Execution Logs</h4>
          <p className="text-xs text-gray-500">web_automation_execution_logs_v2</p>
        </div>
        <button type="button" onClick={onReload} className="rounded-md bg-slate-700 px-3 py-2 text-sm text-white">再取得</button>
      </div>

      {logs.length === 0 ? <EmptyBox>ログがありません。</EmptyBox> : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="p-2">started_at</th><th className="p-2">flow</th><th className="p-2">version</th><th className="p-2">status</th><th className="p-2">duration</th><th className="p-2">error</th></tr></thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id ?? log.execution_uuid} className="border-t border-gray-100">
                  <td className="whitespace-nowrap p-2">{log.started_at ?? '-'}</td>
                  <td className="p-2 font-mono">{log.flow_key ?? '-'}</td>
                  <td className="p-2">{log.flow_version ?? '-'}</td>
                  <td className="p-2"><StatusBadge status={log.status} /></td>
                  <td className="p-2">{log.duration_ms == null ? '-' : `${log.duration_ms} ms`}</td>
                  <td className="max-w-[320px] truncate p-2 text-red-700">{log.error_message ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status }) {
  const classes = status === 'published' || status === 'success'
    ? 'bg-green-100 text-green-700'
    : status === 'failed' || status === 'disabled'
      ? 'bg-red-100 text-red-700'
      : 'bg-amber-100 text-amber-700'

  return <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${classes}`}>{status || '-'}</span>
}

function TabButton({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`border-b-2 px-4 py-2 text-sm font-semibold ${active ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>{children}</button>
}

function Field({ label, value, onChange, readOnly = false, placeholder = '' }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span><input type="text" value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} readOnly={readOnly} placeholder={placeholder} className={`w-full rounded-md border border-gray-300 px-3 py-2 text-sm ${readOnly ? 'bg-gray-100 text-gray-500' : 'bg-white'}`} /></label>
}

function NumberField({ label, value, onChange, min = 0 }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span><input type="number" min={min} value={value ?? 0} onChange={(e) => onChange?.(Number(e.target.value))} className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" /></label>
}

function SelectField({ label, value, onChange, options }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span><select value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm">{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>
}

function TextArea({ label, value, onChange, rows = 4 }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span><textarea value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} rows={rows} className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm" /></label>
}

function JsonEditor({ label, value, onChange }) {
  const [localError, setLocalError] = useState('')
  const format = () => {
    try {
      const next = JSON.stringify(JSON.parse(value || '{}'), null, 2)
      onChange(next)
      setLocalError('')
    } catch (e) {
      setLocalError(e.message)
    }
  }
  return <div><div className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold text-gray-600">{label}</span><button type="button" onClick={format} className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-700">整形</button></div><textarea value={value ?? ''} onChange={(e) => { onChange(e.target.value); setLocalError('') }} rows={8} spellCheck={false} className="w-full resize-y rounded-md border border-gray-300 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100" />{localError && <p className="mt-1 text-xs text-red-600">{localError}</p>}</div>
}

function CodeEditor({ label, value, onChange }) {
  return <label className="block"><span className="mb-1 block text-xs font-semibold text-gray-600">{label}</span><textarea value={value ?? ''} onChange={(e) => onChange?.(e.target.value)} rows={18} spellCheck={false} className="w-full resize-y rounded-md border border-gray-300 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100" /></label>
}

function ErrorBox({ children }) {
  return <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{children}</div>
}

function EmptyBox({ children }) {
  return <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">{children}</div>
}
