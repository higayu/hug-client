import { useCallback, useEffect, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell,
} from 'recharts'
import { selectLaravelAuth } from '@/store/slices/authSlice'

const format = (value) => Number(value ?? 0).toLocaleString('ja-JP', { maximumFractionDigits: 8 })
const tooltipDate = (label, payload) => payload?.[0]?.payload?.date ?? label
const legendStyle = { fontSize: 12 }
const seriesRows = (chart, dates = []) => (chart?.labels ?? []).map((label, index) => ({
  label, date: dates[index],
  ...Object.fromEntries((chart.datasets ?? []).map((dataset, i) => [`v${i}`, dataset.data[index] ?? 0])),
}))

function Card({ title, children }) {
  return <section className="min-w-0 rounded-lg border border-gray-200 bg-white p-4"><h4 className="mb-3 font-semibold">{title}</h4>{children}</section>
}

function DailyChart({ chart, dates, line = false }) {
  const data = seriesRows(chart, dates)
  const Chart = line ? LineChart : BarChart
  return (
    <div className="h-64 w-full min-w-0">
      <ResponsiveContainer width="100%" height="100%">
        <Chart data={data} margin={{ top: 6, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="label" minTickGap={24} tick={{ fontSize: 11 }} />
          <YAxis width={65} tick={{ fontSize: 11 }} tickFormatter={format} />
          <Tooltip formatter={format} labelFormatter={tooltipDate} />
          <Legend wrapperStyle={legendStyle} />
          {(chart?.datasets ?? []).map((dataset, index) => line
            ? <Line key={index} type="monotone" dataKey={`v${index}`} name={dataset.label} stroke={dataset.borderColor} dot={false} strokeWidth={2} isAnimationActive={false} />
            : <Bar key={index} dataKey={`v${index}`} name={dataset.label} fill={dataset.backgroundColor} isAnimationActive={false} />)}
        </Chart>
      </ResponsiveContainer>
    </div>
  )
}

export default function UsageCharts({ isActive }) {
  const auth = useSelector(selectLaravelAuth)
  const accountId = auth.user?.staff_id ?? auth.user?.id
  const canViewAll = auth.authenticated === true && auth.hasAccessToken === true && auth.status !== 'loading' && auth.user?.role_code === 'admin'
  const [days, setDays] = useState(30)
  const [scope, setScope] = useState(() => canViewAll ? 'all' : 'company')
  const effectiveScope = canViewAll ? scope : 'company'
  const [companyId, setCompanyId] = useState('')
  const [companies, setCompanies] = useState({})
  const key = `${accountId ?? ''}:${auth.user?.company_id ?? ''}:${effectiveScope}:${companyId}:${days}`
  const [state, setState] = useState({ key: '', data: null, loading: false, error: '' })
  const sequence = useRef(0)

  useEffect(() => { setScope(canViewAll ? 'all' : 'company') }, [canViewAll])

  const refresh = useCallback(async () => {
    const requestId = ++sequence.current
    setState({ key, data: null, loading: true, error: '' })
    try {
      if (!auth.authenticated || !accountId) throw new Error('Laravelにログインしてください。')
      if (!window.electronAPI?.laravel_ai_usageCharts) throw new Error('グラフを表示するため、更新したアプリを再起動してください。')
      const result = await window.electronAPI.laravel_ai_usageCharts({ days, scope: effectiveScope, ...(canViewAll && companyId && effectiveScope === 'company' ? { company_id: Number(companyId) } : {}) })
      if (!result?.success) throw new Error(result?.message || '使用量グラフを取得できませんでした。')
      const data = result.data?.data ?? result.data
      if (!data?.daily_tokens || !data?.daily_requests || !data?.model_tokens || !data?.daily_costs) throw new Error('グラフのデータ形式が不正です。')
      if (sequence.current === requestId) { setCompanies(data.companies ?? {}); setState({ key, data, loading: false, error: '' }) }
    } catch (error) {
      if (sequence.current === requestId) setState({ key, data: null, loading: false, error: error.message })
    }
  }, [accountId, auth.authenticated, days, effectiveScope, key, companyId, canViewAll])

  useEffect(() => {
    if (isActive && auth.status !== 'loading') refresh()
    return () => { sequence.current += 1 }
  }, [isActive, auth.status, refresh])

  // Hide old results immediately when the account, scope or period changes.
  const current = state.key === key ? state : { data: null, loading: true, error: '' }
  const data = current.data
  const pieData = (data?.model_tokens.labels ?? []).map((name, i) => ({
    name, value: data.model_tokens.datasets[0]?.data[i] ?? 0,
    color: data.model_tokens.datasets[0]?.backgroundColor[i] ?? '#2563eb',
  })).filter((entry) => entry.value > 0)

  return (
    <section className="space-y-4 rounded-lg border border-gray-200 bg-gray-50 p-4" aria-busy={current.loading}>
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="mr-auto font-semibold">AI利用状況グラフ</h3>
        <label className="text-sm">期間
          <select aria-label="グラフの期間" className="ml-2 rounded border border-gray-300 bg-white p-2" value={days} onChange={(event) => setDays(Number(event.target.value))}>
            {[7, 30, 90].map((value) => <option key={value} value={value}>直近{value}日</option>)}
          </select>
        </label>
        {canViewAll && <label className="text-sm">範囲
          <select aria-label="グラフの集計範囲" className="ml-2 rounded border border-gray-300 bg-white p-2" value={scope} onChange={(event) => setScope(event.target.value)}>
            <option value="company">会社別</option><option value="all">全会社</option>
          </select>
        </label>}
        {canViewAll && scope === 'company' && <label className="text-sm">会社
          <select aria-label="集計する会社" className="ml-2 rounded border border-gray-300 bg-white p-2" value={companyId} onChange={(event) => setCompanyId(event.target.value)}>
            <option value="">所属会社</option>{Object.entries(companies).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>}
        <button type="button" disabled={current.loading} onClick={refresh} className="rounded border border-gray-300 bg-white px-3 py-2 text-sm disabled:opacity-50">グラフ更新</button>
      </div>
      <p className="text-xs text-gray-600">{effectiveScope === 'all' ? '全会社' : '選択・所属会社'}のLaravel経由の利用履歴を集計します。TOKEN未確定の実行は実際の使用量を反映できない場合があります。</p>
      {current.loading && <p role="status" className="text-sm">グラフを取得しています…</p>}
      {current.error && <p role="alert" className="text-sm text-red-600">{current.error}</p>}
      {data && <>
        <p className="text-xs text-gray-500">{data.dates?.[0]} ～ {data.dates?.at(-1)}（{data.timezone}）／ 最終取得: {new Date(data.as_of).toLocaleString('ja-JP', { timeZone: data.timezone })}</p>
        <div className="grid min-w-0 grid-cols-1 gap-4 xl:grid-cols-2">
          <Card title="日別トークン使用量"><DailyChart chart={data.daily_tokens} dates={data.dates} line /></Card>
          <Card title="日別API使用回数"><DailyChart chart={data.daily_requests} dates={data.dates} /></Card>
          <Card title="AIモデル別・総トークン使用割合">
            {pieData.length ? <div className="h-80 min-w-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart><Pie data={pieData} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="70%" isAnimationActive={false}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie><Tooltip formatter={format} /><Legend wrapperStyle={legendStyle} /></PieChart>
              </ResponsiveContainer>
            </div> : <p className="text-sm text-gray-500">この期間のTOKEN使用記録はありません。</p>}
          </Card>
          <Card title="日別推定料金（通貨別）">
            {data.daily_costs.datasets.length ? data.daily_costs.datasets.map((dataset) => <div key={dataset.label}>
              <p className="text-sm font-medium">{dataset.label}</p>
              <DailyChart chart={{ labels: data.daily_costs.labels, datasets: [dataset] }} dates={data.dates} />
            </div>) : <p className="text-sm text-gray-500">この期間の料金記録はありません。</p>}
            <p className="mt-2 text-xs text-gray-500">通貨は合算せず別々に表示します。料金は実行時の設定単価による推定です。</p>
          </Card>
        </div>
      </>}
    </section>
  )
}
