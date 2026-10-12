import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import store from '@/store/store.js'
import { AI_CHAT_TEXT_KEYS, selectAiChatText } from '@/store/slices/aiChatSlice.js'
import {
  isPersonalRecordEditPage,
  readPersonalRecord,
  writePersonalRecord,
  clickPersonalRecordDraft,
} from './parts/personalRecordWebview.js'

function combinePersonalRecordAndAiText(existingText, aiText) {
  const original = typeof existingText === 'string' ? existingText : ''
  const addition = typeof aiText === 'string' ? aiText : ''
  if (!addition) return original
  if (!original) return addition
  // 既に同一のAIメモを末尾に反映済みなら二重追記しない。
  if (original === addition || original.endsWith(`\n\n${addition}`)) return original
  return `${original}\n\n${addition}`
}

function PersonalRecordControls({ webview, childName, childId, date, initialOpen }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [original, setOriginal] = useState('')
  const [aiValue, setAiValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function showModal() {
    if (busy) return
    setMessage('')
    try {
      if (!isPersonalRecordEditPage(webview)) throw new Error('個人記録の編集画面ではありません')
      const result = await readPersonalRecord(webview)
      if (!result?.found) throw new Error('個人記録の入力欄が見つかりません')
      const aiText = selectAiChatText(
        date,
        childId,
        AI_CHAT_TEXT_KEYS.PERSONAL
      )(store.getState())
      setValue(result.value)
      setAiValue(aiText ?? '')
      setOriginal(result.value)
      setOpen(true)
    } catch (error) {
      setMessage(error.message || '記録の取得に失敗しました')
    }
  }

  async function applyValue() {
    setBusy(true)
    setMessage('')
    try {
      if (!isPersonalRecordEditPage(webview)) throw new Error('編集画面が切り替わっています')
      const finalText = combinePersonalRecordAndAiText(value, aiValue)
      const result = await writePersonalRecord(webview, finalText)
      if (!result?.ok) throw new Error(result?.message || '入力に失敗しました')
      setOriginal(finalText)
      setOpen(false)
      setMessage('記録を入力しました（まだ保存されていません）')
      return true
    } catch (error) {
      setMessage(error.message || '入力に失敗しました')
      return false
    } finally {
      setBusy(false)
    }
  }

  async function saveDraft() {
    setBusy(true)
    setMessage('')
    try {
      if (!isPersonalRecordEditPage(webview)) throw new Error('編集画面が切り替わっています')
      if (open) {
        const finalText = combinePersonalRecordAndAiText(value, aiValue)
        const result = await writePersonalRecord(webview, finalText)
        if (!result?.ok) throw new Error(result?.message || '入力に失敗しました')
        setOriginal(finalText)
      }
      const result = await clickPersonalRecordDraft(webview)
      if (!result?.ok) throw new Error(result?.message || '保存ボタンを押せませんでした')
      setOpen(false)
      setMessage('下書き保存ボタンを押しました。保存結果はWebViewで確認してください。')
    } catch (error) {
      setMessage(error.message || '下書き保存に失敗しました')
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (initialOpen) void showModal()
  }, [])

  useEffect(() => {
    const onRequest = () => void showModal()
    const onClose = () => { setOpen(false); setMessage('') }
    webview.addEventListener('personal-record-open-modal', onRequest)
    webview.addEventListener('did-start-loading', onClose)
    return () => {
      webview.removeEventListener('personal-record-open-modal', onRequest)
      webview.removeEventListener('did-start-loading', onClose)
    }
  }, [webview, busy])

  return (
    <>
      <div className="fixed right-5 bottom-5 z-[9000] flex flex-col items-end gap-2 pointer-events-none">
        {message && <div role="status" className="max-w-sm rounded-lg bg-white border p-3 shadow-lg text-sm text-slate-800 pointer-events-auto">{message}</div>}
        <div className="flex gap-2 pointer-events-auto">
          <button type="button" onClick={showModal} className="rounded-lg bg-green-600 px-4 py-2 text-white shadow-lg hover:bg-green-700">個人記録を入力</button>
          <button type="button" onClick={saveDraft} disabled={busy} className="rounded-lg bg-purple-700 px-4 py-2 text-white shadow-lg hover:bg-purple-800 disabled:opacity-50">下書き保存</button>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 p-4" role="presentation">
          <section role="dialog" aria-modal="true" aria-label="個人記録の入力" className="flex h-[94vh] max-h-[94dvh] min-h-0 w-full max-w-5xl flex-col gap-4 overflow-hidden rounded-xl bg-white p-4 shadow-2xl sm:p-6">
            <header className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-slate-900">個人記録の入力 {childName ? `- ${childName}` : ''}</h2>
              <button type="button" onClick={() => setOpen(false)} disabled={busy} aria-label="閉じる" className="text-slate-600 hover:text-black">✕</button>
            </header>
            <p className="text-sm text-slate-600">上段はWebViewから読み込んだ既存の個人記録、下段はAI入力欄の一時テキストです。反映時に両方を改行2つで結合します。</p>
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                <label htmlFor="personal-record-existing" className="text-sm font-semibold text-slate-800">個人記録（既存の入力内容）</label>
                <textarea
                  id="personal-record-existing"
                  autoFocus
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  className="min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900"
                  placeholder="WebView内の記録本文を入力してください"
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="personal-record-ai" className="text-sm font-semibold text-slate-800">AI個人記録の一時テキスト</label>
                  <span className="text-xs text-slate-500">日付: {date || '未指定'} / 児童ID: {childId || '未指定'}</span>
                </div>
                <textarea
                  id="personal-record-ai"
                  value={aiValue}
                  onChange={e => setAiValue(e.target.value)}
                  className="min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900"
                  placeholder="この日付・児童IDのAI一時テキストは空です"
                />
              </div>
            </div>
            {(value !== original || aiValue !== '') && <p className="text-xs text-amber-700">「入力欄に反映」で、上段の下に下段を改行2つで追記します。モーダルを閉じるとここでの未反映編集は破棄されます。</p>}
            {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
            <footer className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={() => setOpen(false)} disabled={busy} className="rounded-lg border px-4 py-2 text-slate-800">キャンセル</button>
              <button type="button" onClick={applyValue} disabled={busy} className="rounded-lg bg-green-600 px-4 py-2 text-white disabled:opacity-50">入力欄に反映</button>
              <button type="button" onClick={saveDraft} disabled={busy} className="rounded-lg bg-purple-700 px-4 py-2 text-white disabled:opacity-50">反映して下書き保存</button>
            </footer>
          </section>
        </div>
      )}
    </>
  )
}

// renderer側に単一タブ専用のReactルートを作成します。
export function mountPersonalRecordControls(webview, childName, childId, date, initialOpen = true) {
  const host = document.createElement('div')
  host.dataset.personalRecordControls = webview.id
  document.body.appendChild(host)
  const root = createRoot(host)
  let disposed = false
  const destroy = () => {
    if (disposed) return
    disposed = true
    observer.disconnect()
    root.unmount()
    host.remove()
  }
  const observer = new MutationObserver(() => {
    if (!webview.isConnected) destroy()
  })
  observer.observe(document.body, { childList: true, subtree: true })
  root.render(<PersonalRecordControls webview={webview} childName={childName} childId={childId} date={date} initialOpen={initialOpen} />)
  return { destroy, open: () => webview.dispatchEvent(new Event('personal-record-open-modal')) }
}
