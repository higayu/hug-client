import { useEffect, useRef, useState } from 'react'
import { getPromptHistories, getPromptHistory } from '@/hooks/usePrompt/history'

const buttonClass = 'rounded border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50'

export default function PromptHistoryPanel({ promptId, currentHistoryId, canEdit, disabled, hasDraft, onUseContent, onRestore }) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [refresh, setRefresh] = useState(0)
  const [listing, setListing] = useState(null)
  const [selected, setSelected] = useState(null)
  const [loading, setLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(false)
  const previewSequence = useRef(0)

  useEffect(() => {
    let active = true
    if (!open) return
    setLoading(true)
    setPreviewLoading(false)
    setError('')
    setConfirmation(false)
    setSelected(null)
    previewSequence.current++
    getPromptHistories({ promptId, page })
      .then((data) => { if (active) setListing(data) })
      .catch((reason) => { if (active) { setListing(null); setError(reason.message) } })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false; previewSequence.current++ }
  }, [promptId, currentHistoryId, open, page, refresh])

  const preview = async (historyId) => {
    const sequence = ++previewSequence.current
    setPreviewLoading(true)
    setSelected(null)
    setConfirmation(false)
    setError('')
    try {
      const data = await getPromptHistory({ promptId, historyId })
      if (sequence === previewSequence.current) setSelected(data)
    } catch (reason) {
      if (sequence === previewSequence.current) setError(reason.message)
    } finally {
      if (sequence === previewSequence.current) setPreviewLoading(false)
    }
  }

  const stale = listing && Number(listing.current_history_id) !== Number(currentHistoryId)
  const editable = canEdit && listing?.can_edit && !stale
  const busy = disabled || loading || previewLoading

  return (
    <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <button type="button" className={buttonClass} disabled={disabled} aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? '履歴を閉じる' : 'バージョン履歴を開く'}
      </button>
      {open && (
        <div className="mt-3 space-y-3">
          <p className="text-xs text-gray-600">過去の履歴は上書きしません。内容が変わる保存・復元は、新しいバージョンになります。</p>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {stale && <p role="alert" className="text-sm text-amber-700">他の操作で最新版が変わっています。設定画面の「再読み込み」で最新の本文を確認してください。</p>}
          <button type="button" className={buttonClass} disabled={busy} onClick={() => setRefresh((n) => n + 1)}>履歴を再取得</button>
          {loading ? <p role="status" className="text-sm">履歴を読み込んでいます…</p> : listing && (
            <>
              <ul className="max-h-48 space-y-1 overflow-auto">
                {listing.histories.map((history) => (
                  <li key={history.history_id}>
                    <button type="button" className={`${buttonClass} w-full text-left ${Number(selected?.history_id) === Number(history.history_id) ? 'border-indigo-500 bg-indigo-50' : ''}`}
                      disabled={disabled || previewLoading} onClick={() => preview(history.history_id)}>
                      Ver.{history.version ?? '—'} {history.is_current && '（使用中）'}
                      <span className="ml-2 text-xs">{history.created_at ? new Date(history.created_at).toLocaleString('ja-JP') : ''}　{history.created_by_name ?? '—'}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {listing.histories.length === 0 && <p className="text-sm">履歴はありません。</p>}
              <div className="flex items-center gap-2 text-sm">
                <button type="button" className={buttonClass} disabled={busy || page <= 1} onClick={() => setPage((n) => n - 1)}>前へ</button>
                <span>{listing.page} / {listing.last_page} ページ（全{listing.total}件）</span>
                <button type="button" className={buttonClass} disabled={busy || page >= listing.last_page} onClick={() => setPage((n) => n + 1)}>次へ</button>
              </div>
            </>
          )}
          {previewLoading && <p role="status" className="text-sm">本文を読み込んでいます…</p>}
          {selected && !loading && (
            <div className="space-y-2">
              <p className="text-sm font-bold">Ver.{selected.version ?? '—'} の内容</p>
              <textarea aria-label="選択したバージョンの内容" readOnly value={selected.content} rows={7} className="w-full rounded border border-gray-300 bg-white p-2 text-sm text-gray-900" />
              {editable && (
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={buttonClass} disabled={busy} onClick={() => { onUseContent(selected.content); setConfirmation(false) }}>この内容を編集欄に読み込む</button>
                  <button type="button" className={buttonClass} disabled={busy || hasDraft || Number(selected.history_id) === Number(currentHistoryId)} onClick={() => setConfirmation(true)}>この版を復元</button>
                </div>
              )}
              {hasDraft && canEdit && <p className="text-xs text-amber-700">未保存の変更があります。復元する前に保存するか、再読み込みしてください。編集欄への読み込みは編集中の本文を置き換えます。</p>}
              {confirmation && editable && !hasDraft && (
                <div className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
                  <p>Ver.{selected.version} の内容で現在のプロンプトを置き換えます。内容が変わる場合は新しいバージョンとして保存します。</p>
                  <div className="mt-2 flex gap-2">
                    <button type="button" className={buttonClass} disabled={busy} onClick={async () => {
                      setError('')
                      try { await onRestore(selected.history_id, currentHistoryId); setConfirmation(false); setRefresh((n) => n + 1) }
                      catch (reason) { setError(reason.message) }
                    }}>復元して保存</button>
                    <button type="button" className={buttonClass} disabled={busy} onClick={() => setConfirmation(false)}>キャンセル</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
