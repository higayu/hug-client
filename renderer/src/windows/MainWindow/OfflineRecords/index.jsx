import { useEffect, useState } from 'react'
import { useAppState } from '@/AppStateContext'
import ChilledNamePanel from './ChilledNamePanel'
import { ProfessionalSupportManagerPanel, addProfessionalSupportListAction } from '@/components/common/hug_function'
import { useProfessionalSupportPanelData } from '@/hooks/useProfessionalSupportPanelData'

const today = () => {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
const blank = (date = today()) => ({ id: crypto.randomUUID(), childId: '', childName: '', date, enteredAt: '', leftAt: '', personalNote: '', professionalNote: '', transferred: false })
const field = 'rounded border border-gray-300 bg-white p-2 text-gray-900'
const normalizeSearch = value => String(value ?? '').normalize('NFKC').replace(/\s/g, '').toLocaleLowerCase('ja')

function OfflineProfessionalSupport({ record, facilityId, appState, busy, onOpened }) {
  const supportPanelData = useProfessionalSupportPanelData(record.childId)
  return <ProfessionalSupportManagerPanel
    {...supportPanelData}
    facilityId={facilityId}
    staffId={record.professional_staff_id}
    currentYmd={record.date}
    selectedChildId={record.childId}
    selectedChildName={record.childName}
    initialStartTime={record.enteredAt}
    initialEndTime={record.leftAt}
    initialContents={record.professionalNote}
    onOpened={onOpened}
    onOpenProfessionalSupportList={() => addProfessionalSupportListAction(
      { ...appState, CURRENT_YMD: record.date, FACILITY_ID: facilityId }, record.childId, record.childName,
    )}
    hasEntered={Boolean(record.enteredAt)}
    hasExited={Boolean(record.leftAt)}
    isUIEnabled
    isStop={false}
    loadingAction={busy ? 'offline-record' : null}
    logTag={`OfflineRecord:${record.id}`}
    className="min-w-[220px]"
  />
}

function OfflineRecordContent({ FACILITY_ID, dbChildren = [], dbFacilityChildren = [], iniState, appState, STAFF_ID, dbStaffs = [] }) {
  const enabled = iniState?.appSettings?.features?.offlineRecords?.enabled !== false
  const [open, setOpen] = useState(false)
  const [records, setRecords] = useState([])
  const [selectedDate, setSelectedDate] = useState(today)
  const [refresh, setRefresh] = useState(0)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [drafts, setDrafts] = useState({})
  const [selectedChildId, setSelectedChildId] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [pendingOnly, setPendingOnly] = useState(true)
  const [childSearch, setChildSearch] = useState('')
  const dirty = Object.keys(drafts).length > 0

  useEffect(() => {
    let active = true
    setLoading(true)
    setRecords([])
    setError('')
    Promise.resolve().then(async () => {
      if (!FACILITY_ID) throw new Error('施設を選択してください')
      if (!window.offlineRecords) throw new Error('記録保存機能を利用するにはアプリを再起動してください')
      const result = await window.offlineRecords.list({ facility_id: Number(FACILITY_ID), date: selectedDate })
      if (!result.success) throw new Error(result.message || result.error)
      if (active) setRecords(result.data)
    }).catch(e => { if (active) setError(e.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [FACILITY_ID, selectedDate, refresh])

  function change(record, key, value) {
    setDrafts(previous => ({ ...previous, [record.id]: {
      ...record, [key]: value, ...(key !== 'transferred' ? { transferred: false } : {}),
    } }))
    setMessage('')
  }
  function addRecord() {
    const child = children.find(child => String(child.id) === selectedChildId)
    if (!child || allRows.some(record => String(record.childId) === String(child.id))) return
    const record = { ...blank(selectedDate), childId: child.id, childName: child.name, personal_staff_id: Number(STAFF_ID), professional_staff_id: Number(STAFF_ID) }
    setDrafts(previous => {
      // 連続した追加操作でも、最新の未保存行を確認して重複を防ぐ。
      if (Object.values(previous).some(draft => String(draft.childId) === String(child.id) && draft.date === selectedDate)) return previous
      return { ...previous, [record.id]: record }
    })
    setSelectedChildId('')
    setMessage('児童の行を追加しました。内容を入力して行ごとに保存してください。')
  }
  function discard(id) {
    setDrafts(previous => {
      const next = { ...previous }
      delete next[id]
      return next
    })
  }
  async function save(record) {
    if (record.enteredAt && record.leftAt && record.leftAt < record.enteredAt) {
      setError('退室時刻は入室時刻以降にしてください。')
      return
    }
    setBusy(true)
    setError('')
    setMessage('')
    try {
      const result = await window.offlineRecords.save({ ...record, childId: Number(record.childId), facility_id: Number(FACILITY_ID) })
      if (!result.success) throw new Error(result.message || result.error)
      setRecords(previous => [result.data, ...previous.filter(item => item.id !== result.data.id)])
      discard(record.id)
      setMessage(`${record.childName}の記録をLaravelサーバに保存しました（HUGへの送信は行っていません）`)
    } catch (e) { setError(`保存できませんでした。入力内容は画面に残っています。${e.message}`) }
    finally { setBusy(false) }
  }
  async function deleteTransferred() {
    setBusy(true)
    setDeleteConfirm(false)
    setError('')
    setMessage('')
    const targets = records.filter(record => record.transferred)
    try {
      const result = await window.offlineRecords.deleteTransferred({
        facility_id: Number(FACILITY_ID), date: selectedDate,
        records: targets.map(({ id, revision }) => ({ id, revision })),
      })
      if (!result.success) throw new Error(result.message || result.error)
      const ids = new Set(targets.map(record => record.id))
      setRecords(previous => previous.filter(record => !ids.has(record.id)))
      setMessage(`転記済みの記録を${result.data.deleted}件削除しました`)
    } catch (cause) { setError(cause.message) }
    finally { setBusy(false) }
  }
  function exportCsv() {
    const rows = [['施設ID', '児童名', '日付', '入室', '退室', '個人記録', '専門的支援加算の記録', 'HUG転記', '作成職員ID', '個人記録職員ID', '専門的支援加算職員ID', '記録ID'],
      ...records.map(r => [r.facility_id, r.childName, r.date, r.enteredAt, r.leftAt, r.personalNote, r.professionalNote, r.transferred ? '転記済み' : '未転記', r.created_staff_id, r.personal_staff_id, r.professional_staff_id, r.id])]
    const csv = rows.map(row => row.map(value => {
      const text = String(value ?? '')
      return `"${(/^[=+@\-\t\r\n]/.test(text) ? "'" + text : text).replaceAll('"', '""')}"`
    }).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }))
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `HUG記録-${FACILITY_ID}-${selectedDate}.csv`
    anchor.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const children = dbChildren.filter(child => dbFacilityChildren.some(row =>
    String(row.facility_id) === String(FACILITY_ID) && String(row.children_id) === String(child.id)))
  const search = normalizeSearch(childSearch)
  const matchesChild = child => [child.name, child.furigana].some(value => normalizeSearch(value).includes(search))
  const filteredChildren = children.filter(matchesChild)
  const matchingIds = new Set(filteredChildren.map(child => String(child.id)))
  const allRows = [
    ...records.map(record => drafts[record.id] || record),
    ...Object.values(drafts).filter(draft => !records.some(record => record.id === draft.id)),
  ]
  const availableChildren = filteredChildren.filter(child => !allRows.some(record => String(record.childId) === String(child.id)))
  const tableRows = allRows.filter(record =>
    (drafts[record.id] || !pendingOnly || !record.transferred) &&
    (drafts[record.id] || normalizeSearch(record.childName).includes(search) || matchingIds.has(String(record.childId))))
    .sort((a, b) => a.childName.localeCompare(b.childName, 'ja'))

  return <div style={{ display: enabled ? 'contents' : 'none' }}>
    <div className="flex shrink-0 items-center gap-3 border-b bg-amber-50 px-3 py-2 text-sm text-gray-900">
      <button type="button" className="rounded bg-amber-700 px-3 py-1 text-white" onClick={() => setOpen(true)}>HUG停止時・記録保存</button>
      <span>{selectedDate} 未転記 {records.filter(r => !r.transferred).length}件{dirty ? ' ／ 入力内容が未保存です' : ''}</span>
      {error && !open && <span role="alert">{error}</span>}
    </div>
    {open && <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="offline-title" className="flex max-h-full w-full max-w-7xl flex-col overflow-auto rounded-lg bg-white p-5 text-gray-900 shadow-xl">
        <div className="flex items-center justify-between gap-3">
          <h2 id="offline-title" className="text-lg font-bold">HUG停止中の記録・入退室（Laravel共有）</h2>
          <button type="button" className={field} disabled={busy} onClick={() => setOpen(false)}>閉じる</button>
        </div>
        <p className="my-3 text-sm">HUGへの接続は不要です。Laravelにログインして利用します。個人記録と専門的支援加算の記録を施設・児童・日付ごとに共有します。復旧後はHUGへ手動転記し、転記済みにチェックして保存してください。</p>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span>施設ID：{FACILITY_ID || '未選択'}</span>
          <label>対象日 <input type="date" required className={field} value={selectedDate} disabled={dirty || busy} onChange={event => {
            if (!event.target.value) return
            setSelectedDate(event.target.value)
            setSelectedChildId('')
            setDeleteConfirm(false)
          }} /></label>
          <button type="button" className={field} disabled={dirty || busy || loading} onClick={() => { setRefresh(value => value + 1); setDeleteConfirm(false) }}>一覧を更新</button>
        </div>
        <label className="mb-3 flex flex-col gap-1">児童名で検索
          <input type="search" className={field} value={childSearch} onChange={event => setChildSearch(event.target.value)} placeholder="児童名・ふりがなの一部を入力" />
          <span className="text-sm text-gray-600">児童の選択候補と保存済みの記録を絞り込みます。未保存の行は常に表示します。</span>
        </label>
        {error && <p role="alert" className="mb-3 text-red-700">{error}</p>}
        {message && <p role="status" className="mb-3 text-green-700">{message}</p>}
        <div className="flex flex-col gap-5">
          <div className="order-1 flex flex-col gap-3">
            <div className="flex flex-wrap gap-2">
              <label className="flex items-center gap-2">追加する児童
                <select className={field} value={selectedChildId} disabled={busy || loading} onChange={event => setSelectedChildId(event.target.value)}>
                  <option value="">児童を選択してください</option>
                  {availableChildren.map(child => <option key={child.id} value={child.id}>{child.name}</option>)}
                </select>
              </label>
              <button type="button" className={field} disabled={busy || loading || !FACILITY_ID || !availableChildren.some(child => String(child.id) === selectedChildId)} onClick={addRecord}>児童の行を追加</button>
              <button type="button" className={field} disabled={loading || !records.length} onClick={exportCsv}>対象日の記録をCSV出力</button>
              <button type="button" className={field} disabled={dirty || busy || loading || !records.some(record => record.transferred)} onClick={() => setDeleteConfirm(true)}>対象日の転記済みを削除</button>
            </div>
            {deleteConfirm && <div role="alert" className="rounded border border-red-300 p-3 text-sm">
              <p>{selectedDate} の転記済み記録 {records.filter(record => record.transferred).length}件をLaravelから削除します。全端末に反映され、元に戻せません。</p>
              <button type="button" className="mr-2 rounded bg-red-700 px-3 py-2 text-white" disabled={busy || dirty || loading} onClick={deleteTransferred}>転記済みを削除する</button>
              <button type="button" className={field} onClick={() => setDeleteConfirm(false)}>キャンセル</button>
            </div>}
            <label><input type="checkbox" checked={pendingOnly} onChange={e => setPendingOnly(e.target.checked)} /> 未転記のみ表示</label>
            {dirty && <p className="text-sm text-amber-800">未保存の行があります。行ごとに保存してください。閉じても入力内容は保持しますが、再起動すると未保存の入力は失われます。</p>}
            <p className="text-sm text-gray-600">同じ施設・日付では、同じ児童は1行だけ追加できます（未保存・転記済みを含む）。児童の行を追加して、時刻・個人記録・専門的支援加算を直接入力してください。時刻や記録を変更すると未転記に戻ります。CSVには保存済みの内容を出力します。復旧後は児童名を開いた中の「個」から個人記録を、専門支援欄から専門的支援を登録できます。各登録画面には行の入力内容を渡します。HUGで保存結果を確認してから転記済みにしてください。</p>
            <div className="max-h-[55vh] overflow-auto rounded border shadow-sm">
              <table className="w-full border-collapse text-sm">
                <thead className="sticky top-0 z-10 bg-gray-100">
                  <tr>{['児童名', '入室', '退室', '個人記録', '専門支援', 'HUG転記', '操作'].map(label =>
                    <th key={label} scope="col" className="whitespace-nowrap border border-slate-300 p-3">{label}</th>)}</tr>
                </thead>
                <tbody>
                  {loading ? <tr><td colSpan={7} className="p-3">保存記録を読み込み中…</td></tr> : !tableRows.length ?
                    <tr><td colSpan={7} className="p-3">該当する児童・記録はありません。</td></tr> : tableRows.map(record => {
                      const unsaved = Boolean(drafts[record.id])
                      const child = children.find(child => String(child.id) === String(record.childId))
                      return <tr key={record.id} className={unsaved ? 'bg-amber-50' : 'odd:bg-white even:bg-slate-50'}>
                        <th scope="row" className="min-w-[160px] border border-slate-300 p-3 text-left">
                          <ChilledNamePanel
                            selectedChildId={record.childId}
                            selectedChildName={record.childName}
                            currentYmd={record.date}
                            initialContents={record.personalNote}
                            facilityId={FACILITY_ID}
                            staffId={record.personal_staff_id}
                            onOpened={() => setOpen(false)}
                            onError={cause => setError(cause.message || String(cause))}
                            disabled={busy || loading}
                            labelName={<div className="flex flex-col leading-tight">
                              {child?.furigana && <span className="mb-1 text-[11px] font-medium text-slate-500">{child.furigana}</span>}
                              <span className="font-semibold">{record.childName}</span>
                            </div>}
                            panelClassName="min-w-[220px] text-center text-2xl"
                            className="block w-full rounded-full border border-green-500 bg-transparent px-1 py-0.5 text-left text-slate-900 hover:bg-sky-50 hover:text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
                          />
                          {unsaved && <span className="mt-1 block text-xs text-amber-800">未保存</span>}
                        </th>
                        {['enteredAt', 'leftAt'].map((key, index) => <td key={key} className="border border-slate-300 p-2">
                          <input type="time" className={field} aria-label={`${record.childName}の${index === 0 ? '入室' : '退室'}時刻`} value={record[key]} disabled={busy} onChange={event => change(record, key, event.target.value)} />
                        </td>)}
                        {['personalNote', 'professionalNote'].map((key, index) => <td key={key} className="min-w-[240px] border border-slate-300 p-2">
                          <label className="mb-2 flex flex-col gap-1">
                            {index === 0 ? '個人記録の職員' : '専門的支援加算の職員'}
                            <select className={field} aria-label={`${record.childName}の${index === 0 ? '個人記録' : '専門的支援加算'}の職員`} value={record[index === 0 ? 'personal_staff_id' : 'professional_staff_id'] ?? ''} disabled={busy} onChange={event => change(record, index === 0 ? 'personal_staff_id' : 'professional_staff_id', Number(event.target.value))}>
                              <option value="" disabled>職員を選択してください</option>
                              {dbStaffs.map(staff => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
                            </select>
                          </label>
                          {key === 'professionalNote' && <div className="mb-2">
                            <OfflineProfessionalSupport record={record} facilityId={FACILITY_ID} appState={appState} busy={busy || loading} onOpened={() => setOpen(false)} />
                          </div>}
                          <textarea rows={4} maxLength={100000} className={`${field} w-full`} aria-label={`${record.childName}の${index === 0 ? '個人記録' : '専門的支援加算の記録'}`} value={record[key]} disabled={busy} onChange={event => change(record, key, event.target.value)} />
                        </td>)}
                        <td className="whitespace-nowrap border border-slate-300 p-3 text-center">
                          <label><input type="checkbox" checked={record.transferred} disabled={busy} onChange={event => change(record, 'transferred', event.target.checked)} /> 転記済み</label>
                        </td>
                        <td className="border border-slate-300 p-3">
                          <div className="flex flex-col gap-2">
                            <button type="button" className="whitespace-nowrap rounded bg-blue-700 px-3 py-2 text-white disabled:opacity-50" disabled={!unsaved || busy || loading || !FACILITY_ID} onClick={() => save(record)} aria-label={`${record.childName}の記録を保存`}>保存</button>
                            {unsaved && <button type="button" className={field} disabled={busy} onClick={() => discard(record.id)}>{record.revision ? '変更を破棄' : '追加を取消'}</button>}
                          </div>
                        </td>
                      </tr>
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>
    </div>}
  </div>
}

export default function OfflineRecords() {
  const state = useAppState()
  return <OfflineRecordContent key={`${state.STAFF_ID}:${state.FACILITY_ID}`} {...state} />
}
