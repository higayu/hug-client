import { useState } from 'react'
import ChildrenUpdateButton from '@/components/common/Synchronization/ChildrenUpdateButton'
import { useDataBase } from '@/hooks/useDataBase'

const asArray = (value) => Array.isArray(value) ? value : []
const str = (value) => String(value ?? '')
const deleted = (child) => child.is_delete === true || str(child.is_delete) === '1'

export default function ChildManager({ databaseState, facilityId, canSync = false }) {
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState('')
  const [includeDeleted, setIncludeDeleted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const { reloadData } = useDataBase()
  const facility = asArray(databaseState?.facilitys).find((row) => str(row.id) === str(facilityId))
  const ids = new Set(asArray(databaseState?.facility_children)
    .filter((row) => str(row.facility_id) === str(facilityId))
    .map((row) => str(row.children_id ?? row.child_id)).filter(Boolean))
  const children = facilityId ? asArray(databaseState?.children).filter((row) => ids.has(str(row.id))) : []
  const keyword = query.trim().normalize('NFKC').toLowerCase()
  const visible = children.filter((row) => (includeDeleted || !deleted(row)) &&
    [row.name, row.furigana, row.id].some((value) => str(value).normalize('NFKC').toLowerCase().includes(keyword)))
  const selected = visible.find((row) => str(row.id) === selectedId)
  const typeName = (row) => asArray(databaseState?.children_type).find((type) => str(type.id) === str(row.children_type_id))?.name
  const refresh = async () => {
    setLoading(true)
    setMessage('')
    try {
      const ok = await reloadData({ reason: 'child-manager' })
      setMessage(ok ? '一覧を再取得しました。' : '一覧の再取得に失敗しました。')
    } catch {
      setMessage('一覧の再取得に失敗しました。')
    } finally {
      setLoading(false)
    }
  }
  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-semibold text-gray-800">児童管理</h3><p className="text-sm text-gray-500">対象施設：{facility?.name ?? (facilityId || '未選択')}</p></div>
        <div className="flex flex-wrap gap-2">
          <ChildrenUpdateButton facilityId={facilityId} disabled={!facilityId || !canSync || loading} className="rounded bg-sky-600 px-4 py-2 text-sm text-white hover:bg-sky-700 disabled:opacity-50" />
          <button type="button" onClick={refresh} disabled={!facilityId || loading} className="rounded border px-3 py-2 text-sm disabled:opacity-50">{loading ? '再取得中...' : '一覧再取得'}</button>
        </div>
      </div>
      <p className="text-xs text-gray-500">HUG同期完了後は「一覧再取得」を押してください。</p>
      {!canSync && <p className="text-xs text-gray-500">この施設の同期操作権限がありません。</p>}
      {message && <p role="status" className="text-sm text-gray-700">{message}</p>}
      <div className="flex flex-wrap items-center gap-3">
        <input aria-label="児童検索" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="氏名・ふりがな・IDで検索" className="min-w-0 flex-1 rounded border px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={includeDeleted} onChange={(event) => setIncludeDeleted(event.target.checked)} />削除フラグありも表示</label>
        <span className="text-sm text-gray-500">{visible.length} / {children.length} 件</span>
      </div>
      <div className="max-h-80 overflow-auto rounded border">
        <table className="w-full text-left text-sm"><thead className="sticky top-0 bg-gray-100"><tr>{['ID', '氏名', 'ふりがな', '区分', '状態'].map((label) => <th key={label} className="p-2">{label}</th>)}</tr></thead>
          <tbody>{visible.map((row) => <tr key={row.id} className={`border-t ${str(row.id) === selectedId ? 'bg-blue-50' : ''}`}><td className="p-2">{row.id}</td><td className="p-2"><button type="button" onClick={() => setSelectedId(str(row.id))} className="text-blue-700 underline">{row.name || '氏名未設定'}</button></td><td className="p-2">{row.furigana || '—'}</td><td className="p-2">{typeName(row) || '—'}</td><td className="p-2">{deleted(row) ? '削除' : row.leaving_at ? '退所日あり' : '登録中'}</td></tr>)}</tbody>
        </table>
        {!visible.length && <p className="p-4 text-center text-sm text-gray-500">{facilityId ? '該当する児童がいません。' : '施設を選択してください。'}</p>}
      </div>
      {selected && <div className="rounded border bg-gray-50 p-3"><h4 className="mb-2 font-semibold">基本情報</h4><dl className="grid gap-2 text-sm sm:grid-cols-2">{[['児童ID', selected.id], ['氏名', selected.name], ['ふりがな', selected.furigana], ['児童区分', typeName(selected)], ['退所日', selected.leaving_at], ['削除フラグ', deleted(selected) ? 'あり' : 'なし']].map(([label, value]) => <div key={label}><dt className="text-xs text-gray-500">{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl></div>}
    </section>
  )
}
