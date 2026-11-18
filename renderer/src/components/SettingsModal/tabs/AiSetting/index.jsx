import UsageCharts from './UsageCharts'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useAppState } from '@/AppStateContext'
import { selectLaravelAuth } from '@/store/slices/authSlice'
import { useToast } from '@/utils/notifications.jsx'

const AI_OPTIONS = [
  ['gemini', 'Gemini'], ['chatGPT', 'ChatGPT'], ['LaravelApi', 'Laravel API'],
  ['ollama', 'Ollama'], ['deepseek', 'DeepSeek'], ['openrouter', 'OpenRouter'],
]
const number = (value) => Number(value ?? 0).toLocaleString('ja-JP')
const date = (value) => value ? new Date(value).toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }) : '—'

export default function AiSetting({ isActive = true }) {
  const { iniState, appState, setIniState, updateAppState } = useAppState()
  const auth = useSelector(selectLaravelAuth)
  const accountId = auth.user?.staff_id ?? auth.user?.id
  const { showSuccessToast, showErrorToast } = useToast()
  const [selected, setSelected] = useState(iniState?.apiSettings?.useAI ?? appState?.USE_AI ?? 'gemini')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const sequence = useRef(0)

  useEffect(() => {
    setSelected(iniState?.apiSettings?.useAI ?? appState?.USE_AI ?? 'gemini')
  }, [iniState?.apiSettings?.useAI, appState?.USE_AI])

  const refresh = useCallback(async () => {
    const requestId = ++sequence.current
    setLoading(true)
    setData(null)
    setError('')
    try {
      if (!accountId) throw new Error('Laravelにログインしてください。')
      if (!window.electronAPI?.laravel_ai_settings) throw new Error('AI情報の取得機能を読み込むため、アプリを再起動してください。')
      const response = await window.electronAPI.laravel_ai_settings()
      if (!response?.success) throw new Error(response?.message || response?.error?.message || 'AI情報を取得できませんでした。')
      // Authenticated IPC wraps the Laravel response once more.
      const result = response.data?.data ?? response.data
      if (!result?.model) throw new Error('Laravelから有効なAI情報が返されませんでした。')
      if (sequence.current === requestId) setData(result)
    } catch (cause) {
      if (sequence.current === requestId) setError(cause.message)
    } finally {
      if (sequence.current === requestId) setLoading(false)
    }
  }, [accountId])

  useEffect(() => {
    setData(null)
    if (isActive) refresh()
    return () => { sequence.current += 1 }
  }, [isActive, refresh])

  async function save() {
    if (saving) return
    setSaving(true)
    try {
      const result = await window.electronAPI.updateIniSetting('apiSettings.useAI', selected)
      if (!result?.success) throw new Error(result?.error || 'AI種別の保存に失敗しました。')
      setIniState((previous) => ({ ...previous, apiSettings: { ...previous?.apiSettings, useAI: selected } }))
      updateAppState({ USE_AI: selected })
      showSuccessToast('AI種別を保存しました')
    } catch (cause) {
      showErrorToast(cause.message)
    } finally {
      setSaving(false)
    }
  }

  const usage = data?.personal_usage
  const budget = data?.budget

  return (
    <div className="space-y-5 p-4 text-gray-800">
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <label htmlFor="settings-ai-type" className="mb-2 block font-semibold">AI種別</label>
        <div className="flex flex-wrap gap-3">
          <select id="settings-ai-type" value={selected} onChange={(event) => setSelected(event.target.value)} disabled={saving} className="rounded-md border border-gray-300 px-3 py-2">
            {AI_OPTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <button type="button" onClick={save} disabled={saving} className="rounded-md bg-blue-600 px-4 py-2 text-white disabled:opacity-50">{saving ? '保存中…' : 'AI種別を保存'}</button>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4" aria-busy={loading}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h3 className="font-semibold">LaravelのAIモデル・使用状況</h3>
          <button type="button" onClick={refresh} disabled={loading} className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50">{loading ? '取得中…' : '更新'}</button>
        </div>
        <p className="mb-4 text-sm text-gray-600">Laravel経由で実行したAIの情報です。AI種別を直接Geminiなどに設定した場合の利用は、この集計に含まれません。</p>
        {loading && <p role="status">Laravelから取得しています…</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        {data && <>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <dt>提供元</dt><dd>{data.provider}</dd>
            <dt>使用モデル</dt><dd className="break-all">{data.display_name}（{data.model}）</dd>
            <dt>認証アカウント</dt><dd>{data.account?.name}（職員ID: {data.account?.staff_id}）</dd>
          </dl>
          {!data.usage_tracked ? <p className="mt-4 text-sm">Ollamaは使用量の記録・残量管理の対象外です。</p> : <>
            <h4 className="mb-2 mt-5 font-semibold">自分の今月の使用量（日本時間）</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt>入力</dt><dd>{number(usage?.input_tokens)} トークン</dd>
              <dt>出力</dt><dd>{number(usage?.output_tokens)} トークン</dd>
              <dt>合計</dt><dd>{number(usage?.total_tokens)} トークン</dd>
              <dt>実行回数</dt><dd>{number(usage?.request_count)} 回</dd>
            </dl>
            {usage?.unconfirmed > 0 && <p className="mt-2 text-sm text-amber-700">使用量未確定の実行が{number(usage.unconfirmed)}件あります。</p>}
            <h4 className="mb-2 mt-5 font-semibold">全体の推定残量（{budget?.period === 'daily' ? '本日' : '今月'}・日本時間）</h4>
            {budget ? <>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <dt>独自の上限</dt><dd>{number(budget.limit)} トークン</dd>
                <dt>全職員の使用済み量</dt><dd>{number(budget.used)} トークン</dd>
                <dt>推定残量</dt><dd className="font-semibold">{number(budget.remaining)} トークン</dd>
                <dt>次回リセット</dt><dd>{date(budget.resets_at)}</dd>
              </dl>
              {budget.exceeded > 0 && <p className="mt-2 text-sm text-red-600">上限を{number(budget.exceeded)}トークン超過しています。</p>}
              {budget.unconfirmed > 0 && <p className="mt-2 text-sm text-amber-700">全体に使用量未確定の実行が{number(budget.unconfirmed)}件あり、残量が多く表示される可能性があります。</p>}
              <p className="mt-2 text-xs text-gray-500">Google公式の残量ではなく、独自上限から記録済み使用量を引いた推定値です。</p>
            </> : <p className="text-sm text-gray-600">上限未設定です。管理者がFilamentの「AI種別」で設定すると表示されます。</p>}
          </>}
          <p className="mt-4 text-xs text-gray-500">取得日時: {date(data.fetched_at)}</p>
        </>}
      </div>
      <UsageCharts isActive={isActive} />
    </div>
  )
}
