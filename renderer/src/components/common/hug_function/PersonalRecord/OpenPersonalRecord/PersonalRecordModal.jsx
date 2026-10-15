import React, { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import store from '@/store/store.js'
import ToggleContainer from '@/components/ui/ToggleContainer'
import PlanNotesPanel from '@/components/common/hug_function/Plan/PlanNotesPanel'
import { fetchPersonSupportPlan } from '@/components/common/hug_function/Plan/PersonSupportPlan/function'
import { selectChildren, setAllTables } from '@/store/slices/databaseSlice'
import { laravelApi } from '@/hooks/useDataBase/sql/laravelApi'
import { loadTempNote } from '@/hooks/useNote/noteUtils.js'
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

// createRoot で独立マウントされるため Context hooks を使わず Redux を参照する。
function findIndividualPlan(childId) {
  const id = String(childId ?? '')
  if (!id) return ''
  const child = selectChildren(store.getState())
    .find(row => String(row?.id ?? row?.children_id ?? '') === id)
  // 空に更新された計画も最新値として扱う。
  return typeof child?.notes2 === 'string' ? child.notes2 : ''
}

function PersonalRecordControls({ webview, childName, childId, date, initialOpen, memoContext }) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')
  const [original, setOriginal] = useState('')
  const [aiValue, setAiValue] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [individualNotes, setIndividualNotes] = useState(() => findIndividualPlan(childId))
  const [planBusy, setPlanBusy] = useState(false)
  const [planError, setPlanError] = useState('')

  useEffect(() => {
    const syncPlan = () => setIndividualNotes(findIndividualPlan(childId))
    syncPlan()
    return store.subscribe(syncPlan)
  }, [childId])

  async function updateIndividualPlan() {
    if (planBusy || !childId) return
    setPlanBusy(true)
    setPlanError('')
    try {
      const facilityId = store.getState().appState?.FACILITY_ID || memoContext?.FACILITY_ID
      if (!facilityId) throw new Error('施設IDを取得できません')
      const markdown = await fetchPersonSupportPlan({
        facilityId,
        selectChild: childId,
        loadDataBase: async () => {
          const tables = await laravelApi.getAllTables()
          if (tables && typeof tables === 'object') store.dispatch(setAllTables(tables))
        },
      })
      if (typeof markdown === 'string') setIndividualNotes(markdown)
    } catch (error) {
      setPlanError(error?.message || '個別支援計画の更新に失敗しました')
    } finally {
      setPlanBusy(false)
    }
  }

  async function showModal() {
    if (busy) return
    setBusy(true)
    setMessage('')
    try {
      if (!isPersonalRecordEditPage(webview)) throw new Error('個人記録の編集画面ではありません')
      const result = await readPersonalRecord(webview)
      if (!result?.found) throw new Error('個人記録の入力欄が見つかりません')
      const note = { value: { memo1: '', memo2: '' } }
      await loadTempNote(childId, note, memoContext, { throwOnError: true })
      const aiText = note.value.memo1 ?? ''
      setValue(result.value)
      setAiValue(aiText ?? '')
      setOriginal(result.value)
      setOpen(true)
    } catch (error) {
      setMessage(error.message || '記録の取得に失敗しました')
    } finally {
      setBusy(false)
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

  const hasInitialRecord = Boolean(String(original ?? '').trim())

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
            <div className="shrink-0 max-h-[35vh] overflow-y-auto">
              <ToggleContainer buttonLabel="個別支援計画を表示・更新" defaultOpen={false}>
                <PlanNotesPanel
                  type="individual"
                  childId={childId}
                  notes={individualNotes}
                  emptyText="個別支援計画はまだ保存されていません"
                  updateControl={
                    <button
                      type="button"
                      onClick={updateIndividualPlan}
                      disabled={planBusy || !childId}
                      className="rounded bg-green-600 px-3 py-2 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-50"
                    >
                      {planBusy ? '取得中...' : '個別支援計画を更新'}
                    </button>
                  }
                />
                {planError && <p role="alert" className="mt-2 text-xs text-red-700">{planError}</p>}
              </ToggleContainer>
            </div>
            <p className="text-sm text-slate-600">保存済みの記録がある場合は、一時メモ１と分けて表示します。反映時には改行2つで結合します。</p>
            <div className="flex min-h-0 flex-1 flex-col gap-3">
              {hasInitialRecord && <div className="max-h-[40%] shrink-0 overflow-y-auto">
                <ToggleContainer buttonLabel="保存済みの個人記録" defaultOpen={true}>
                  <label htmlFor="personal-record-existing" className="text-sm font-semibold text-slate-800">個人記録（既存の入力内容）</label>
                  <textarea
                    id="personal-record-existing"
                    autoFocus
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="mt-1 h-32 min-h-24 w-full resize-y overflow-y-auto rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900"
                    placeholder="WebView内の記録本文を入力してください"
                  />
                </ToggleContainer>
              </div>}
              <div className="flex min-h-0 flex-1 flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <label htmlFor="personal-record-ai" className="text-sm font-semibold text-slate-800">一時メモ１（編集可能）</label>
                  <span className="text-xs text-slate-500">日付: {date || '未指定'} / 児童ID: {childId || '未指定'}</span>
                </div>
                <textarea
                  id="personal-record-ai"
                  autoFocus={!hasInitialRecord}
                  value={aiValue}
                  onChange={e => setAiValue(e.target.value)}
                  className="min-h-0 w-full flex-1 resize-none overflow-y-auto rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900"
                  placeholder="保存済みの一時メモ１は空です"
                />
              </div>
            </div>
            {(value !== original || aiValue !== '') && <p className="text-xs text-amber-700">「入力欄に反映」で既存記録と一時メモ１を結合します（両方ある場合は改行2つ）。モーダルを閉じると未反映編集は破棄されます。</p>}
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
export function mountPersonalRecordControls(webview, childName, childId, date, initialOpen = true, memoContext = store.getState().appState) {
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
  root.render(<PersonalRecordControls webview={webview} childName={childName} childId={childId} date={date} initialOpen={initialOpen} memoContext={memoContext} />)
  return { destroy, open: () => webview.dispatchEvent(new Event('personal-record-open-modal')) }
}
