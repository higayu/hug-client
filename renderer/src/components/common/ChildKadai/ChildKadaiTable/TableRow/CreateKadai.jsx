import { useState } from 'react'

import { useAppState } from '@/AppStateContext'

import { upsertChildKadai } from './function/UpsertChildKadai'

const asArray = (value) => Array.isArray(value) ? value : []
const today = () => {
  const current = new Date()
  current.setMinutes(current.getMinutes() - current.getTimezoneOffset())
  return current.toISOString().slice(0, 10)
}

function CreateKadai({ initialChildrenId, initialRecordTypeId, onCancel, onSaved }) {
  const { FACILITY_ID, databaseState } = useAppState()
  const [form, setForm] = useState(() => ({
    children_id: initialChildrenId ?? '',
    record_type_id: initialRecordTypeId ?? '',
    date: today(),
    score: '',
    mistakes: '',
    facility_id: FACILITY_ID || '',
    memo1: '',
    memo2: '',
  }))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const change = ({ target }) => {
    setForm((current) => ({ ...current, [target.name]: target.value }))
  }

  const submit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')

    try {
      const saved = await upsertChildKadai({
        ...form,
        id: null,
        score: form.score === '' ? null : Number(form.score),
        mistakes: form.mistakes === '' ? null : Number(form.mistakes),
      })
      await onSaved?.(saved)
    } catch (saveError) {
      console.error('[CreateKadai] create failed:', saveError)
      setError(saveError?.message || '児童課題記録の登録に失敗しました。')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="mx-auto max-w-2xl p-4">
      <h2 className="mb-4 text-xl font-bold">児童課題記録の新規追加</h2>
      <form onSubmit={submit} className="space-y-4 rounded bg-white p-4 shadow">
        <label className="block">日付<input required type="date" name="date" value={form.date} onChange={change} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">児童<select required name="children_id" value={form.children_id} onChange={change} className="mt-1 w-full rounded border p-2"><option value="">選択してください</option>{asArray(databaseState?.children).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="block">記録タイプ<select required name="record_type_id" value={form.record_type_id} onChange={change} className="mt-1 w-full rounded border p-2"><option value="">選択してください</option>{asArray(databaseState?.record_types).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <label className="block">施設<select required name="facility_id" value={form.facility_id} onChange={change} className="mt-1 w-full rounded border p-2"><option value="">選択してください</option>{asArray(databaseState?.facilitys).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
        <div className="grid grid-cols-2 gap-4"><label>点数<input type="number" name="score" value={form.score} onChange={change} className="mt-1 w-full rounded border p-2" /></label><label>ミス数<input type="number" name="mistakes" value={form.mistakes} onChange={change} className="mt-1 w-full rounded border p-2" /></label></div>
        <label className="block">メモ1<input name="memo1" maxLength={255} value={form.memo1} onChange={change} className="mt-1 w-full rounded border p-2" /></label>
        <label className="block">メモ2<textarea name="memo2" value={form.memo2} onChange={change} rows={4} className="mt-1 w-full rounded border p-2" /></label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-between"><button type="button" onClick={onCancel} disabled={saving} className="rounded bg-gray-500 px-4 py-2 text-white">一覧へ戻る</button><button type="submit" disabled={saving} className="rounded bg-blue-600 px-4 py-2 text-white disabled:bg-gray-400">{saving ? '登録中...' : '登録'}</button></div>
      </form>
    </section>
  )
}

export default CreateKadai
