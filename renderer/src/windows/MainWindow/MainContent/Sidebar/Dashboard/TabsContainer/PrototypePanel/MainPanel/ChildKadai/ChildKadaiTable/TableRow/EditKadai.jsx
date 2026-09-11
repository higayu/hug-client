import { useMemo, useState } from 'react'

import { useAppState } from '@/AppStateContext'

import { upsertChildKadai } from './function/UpsertChildKadai'

const asArray = (value) => Array.isArray(value) ? value : []
const dateValue = (value) => value ? String(value).slice(0, 10) : ''

function EditKadai({ record, onCancel, onSaved }) {
  const { databaseState } = useAppState()
  const [form, setForm] = useState(() => ({
    id: record.id,
    children_id: record.children_id ?? '',
    record_type_id: record.record_type_id ?? '',
    date: dateValue(record.date),
    score: record.score ?? '',
    mistakes: record.mistakes ?? '',
    facility_id: record.facility_id ?? '',
    memo1: record.memo1 ?? '',
    memo2: record.memo2 ?? '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const children = useMemo(() => asArray(databaseState?.children), [databaseState?.children])
  const recordTypes = useMemo(() => asArray(databaseState?.record_types), [databaseState?.record_types])
  const facilities = useMemo(() => asArray(databaseState?.facilitys), [databaseState?.facilitys])

  const change = (event) => {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const saved = await upsertChildKadai({
        ...form,
        score: form.score === '' ? null : Number(form.score),
        mistakes: form.mistakes === '' ? null : Number(form.mistakes),
      })
      await onSaved?.(saved)
    } catch (saveError) {
      console.error('[EditKadai] update failed:', saveError)
      setError(saveError?.message || '児童課題記録の更新に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl p-4">
      <h2 className="mb-4 text-xl font-bold">児童課題記録の編集</h2>
      <form onSubmit={submit} className="space-y-4 rounded bg-white p-4 shadow">
        <label className="block">日付<input type="date" name="date" value={form.date} onChange={change} required className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">児童<select name="children_id" value={form.children_id} onChange={change} required className="mt-1 w-full rounded border p-2"><option value="">選択してください</option>{children.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="block">記録タイプ<select name="record_type_id" value={form.record_type_id} onChange={change} required className="mt-1 w-full rounded border p-2"><option value="">選択してください</option>{recordTypes.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="block">施設<select name="facility_id" value={form.facility_id} onChange={change} required className="mt-1 w-full rounded border p-2"><option value="">選択してください</option>{facilities.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-4">
          <label>点数<input type="number" name="score" value={form.score} onChange={change} className="mt-1 w-full rounded border p-2" /></label>
          <label>ミス数<input type="number" name="mistakes" value={form.mistakes} onChange={change} className="mt-1 w-full rounded border p-2" /></label>
        </div>
        <label className="block">メモ1<input name="memo1" maxLength={255} value={form.memo1} onChange={change} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">メモ2<textarea name="memo2" value={form.memo2} onChange={change} rows={4} className="mt-1 w-full rounded border p-2" /></label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-between">
          <button type="button" onClick={onCancel} disabled={saving} className="rounded bg-gray-500 px-4 py-2 text-white">一覧へ戻る</button>
          <button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400">{saving ? '更新中...' : '更新'}</button>
        </div>
      </form>
    </section>
  )
}

export default EditKadai
