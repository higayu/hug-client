import { useState } from 'react'
import { useSelector } from 'react-redux'
import { DAY, iso, parseDate as parse, selectPersonalRecordRole, maxRangeDays, canUseMonthly } from './policy'

export function usePersonalRecordRange(year, month, facilityId) {
  const role = useSelector(state => selectPersonalRecordRole(state, facilityId))
  const authorized = role != null
  const admin = canUseMonthly(role)
  const limit = maxRangeDays(role)
  const [mode, setMode] = useState('range')
  const [dates, setDates] = useState(null)
  const key = `${year}-${month}`
  const first = `${year}-${String(month).padStart(2, '0')}-01`
  const start = dates?.key === key ? dates.start : first
  const end = dates?.key === key ? dates.end : Number.isFinite(parse(first)) ? iso(parse(first) + 6 * DAY) : ''
  const max = Number.isFinite(parse(start)) ? iso(parse(start) + (limit - 1) * DAY) : undefined
  const days = (parse(end) - parse(start)) / DAY + 1
  const monthly = admin && mode === 'month'
  const valid = authorized && (monthly ? Number.isInteger(Number(year)) && Number(year)>=2000 && Number(year)<=2100 && Number.isInteger(Number(month)) && Number(month)>=1 && Number(month)<=12 : days >= 1 && days <= limit && Number(start.slice(0,4)) >= 2000 && Number(end.slice(0,4)) <= 2100)
  return {authorized, admin, monthly, valid, limit, start, end, max, days, setMode,
    setStart: value => setDates({key, start:value, end: Number.isFinite(parse(value)) && parse(end)>=parse(value) && parse(end)<=parse(value)+(limit - 1)*DAY ? end : value}),
    setEnd: value => setDates({key, start, end:value}),
    flowKey: monthly ? 'personal_record_list_fetch' : 'personal_record_weekly_list_fetch',
    input: monthly ? {year, month} : {startDate:start,endDate:end}}
}
export function PersonalRecordRangeControls({range:r, disabled}) {
  return <div className="flex flex-wrap items-center gap-2 text-sm">
    {!r.authorized && <span className="text-red-600">この施設の個人記録を取得する権限がありません</span>}
    {r.admin && <select aria-label="取得方式" disabled={disabled} value={r.monthly?'month':'range'} onChange={e=>r.setMode(e.target.value)} className="rounded border px-2 py-1"><option value="range">期間指定（Flow 38）</option><option value="month">月単位（Flow 6）</option></select>}
    {r.authorized && !r.monthly && <><label>開始日 <input type="date" value={r.start} disabled={disabled} onChange={e=>r.setStart(e.target.value)} className="rounded border px-1" /></label><label>終了日 <input type="date" value={r.end} min={r.start} max={r.max} disabled={disabled} onChange={e=>r.setEnd(e.target.value)} className="rounded border px-1" /></label><span className={r.valid?'text-gray-600':'text-red-600'}>{r.valid?`${r.days}日間 / 最大${r.limit}日`:`開始日・終了日を最大${r.limit}日以内で指定してください`}</span></>}
  </div>
}
