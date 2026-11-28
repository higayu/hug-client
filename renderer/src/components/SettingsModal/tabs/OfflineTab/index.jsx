import { useState } from 'react'
import { useAppState } from '@/AppStateContext'

export default function OfflineTab() {
  const { iniState, setIniState } = useAppState()
  const visible = iniState?.appSettings?.features?.offlineRecords?.enabled !== false
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  async function toggle(enabled) {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const result = await window.electronAPI.updateIniSetting('appSettings.features.offlineRecords.enabled', enabled)
      if (!result?.success) throw new Error(result?.error || '設定を保存できませんでした')
      setIniState(previous => ({
        ...previous,
        appSettings: {
          ...previous?.appSettings,
          features: {
            ...previous?.appSettings?.features,
            offlineRecords: { ...previous?.appSettings?.features?.offlineRecords, enabled },
          },
        },
      }))
      setMessage(enabled ? 'サーバ停止中の機能を表示しました' : 'サーバ停止中の機能を非表示にしました')
    } catch (cause) { setError(cause.message) }
    finally { setSaving(false) }
  }

  return <div className="space-y-4 p-4 text-gray-800">
    <h3 className="text-lg font-semibold">サーバ停止中の機能</h3>
    <p className="text-sm">HUGへ接続できないときに、個人記録・専門的支援加算の記録と入退室時刻をLaravelサーバに保存し、同じ施設の端末間で共有できます。</p>
    <label className="flex items-center gap-2">
      <input type="checkbox" checked={visible} disabled={saving} onChange={event => toggle(event.target.checked)} />
      「HUG停止時・記録保存」を表示する
    </label>
    <p className="text-sm text-gray-600">変更は自動保存され、次回起動時にも適用されます。非表示にしても保存済みの記録と現在の入力内容は保持されます。未保存の入力内容はアプリを終了する前に保存してください。</p>
    <p className="text-sm text-gray-600">復旧後はHUGへ手動転記してください。</p>
    {saving && <p role="status">設定を保存中…</p>}
    {message && <p role="status" className="text-green-700">{message}</p>}
    {error && <p role="alert" className="text-red-700">{error}</p>}
  </div>
}
