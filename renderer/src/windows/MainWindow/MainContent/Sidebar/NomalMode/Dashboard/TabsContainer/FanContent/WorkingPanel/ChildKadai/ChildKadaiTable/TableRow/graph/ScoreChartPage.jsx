import { useEffect, useMemo, useState } from 'react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { useAppState } from '@/AppStateContext'

import { getChildKadaiGraph } from '../../../function/GetChildKadaiGraph'

const asArray = (value) => Array.isArray(value) ? value : []

const formatDate = (value) => {
  if (!value) return ''

  const date = new Date(value)
  return Number.isNaN(date.getTime())
    ? String(value).slice(0, 10)
    : date.toLocaleDateString('ja-JP')
}

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const sanitizeFileName = (value) => String(value || 'child-kadai')
  .replace(/[\\/:*?"<>|]/g, '_')
  .trim()

const createChartSvg = (records) => {
  if (!records.length) return ''

  const width = 960
  const height = 380
  const padding = { top: 40, right: 40, bottom: 70, left: 60 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const maxValue = Math.max(1, ...records.flatMap((row) => [row.score, row.mistakes]))
  const yMax = Math.ceil(maxValue / 5) * 5 || 5

  const xAt = (index) => records.length === 1
    ? padding.left + chartWidth / 2
    : padding.left + (chartWidth * index) / (records.length - 1)
  const yAt = (value) => padding.top + chartHeight - (Number(value || 0) / yMax) * chartHeight

  const scorePoints = records.map((row, index) => `${xAt(index)},${yAt(row.score)}`).join(' ')
  const mistakePoints = records.map((row, index) => `${xAt(index)},${yAt(row.mistakes)}`).join(' ')

  const yTicks = Array.from({ length: 6 }, (_, index) => Math.round((yMax * index) / 5))
  const xLabelStep = Math.max(1, Math.ceil(records.length / 8))

  const gridLines = yTicks.map((tick) => {
    const y = yAt(tick)
    return `
      <line x1="${padding.left}" y1="${y}" x2="${width - padding.right}" y2="${y}" stroke="#e5e7eb" />
      <text x="${padding.left - 12}" y="${y + 4}" text-anchor="end" font-size="12" fill="#4b5563">${tick}</text>
    `
  }).join('')

  const xLabels = records.map((row, index) => {
    if (index % xLabelStep !== 0 && index !== records.length - 1) return ''
    return `<text x="${xAt(index)}" y="${height - 30}" text-anchor="middle" font-size="11" fill="#4b5563">${escapeHtml(row.dateLabel)}</text>`
  }).join('')

  const scoreDots = records.map((row, index) => `<circle cx="${xAt(index)}" cy="${yAt(row.score)}" r="3.5" fill="#2563eb" />`).join('')
  const mistakeDots = records.map((row, index) => `<circle cx="${xAt(index)}" cy="${yAt(row.mistakes)}" r="3" fill="#dc2626" />`).join('')

  return `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="点数とミス数の推移グラフ">
      <rect width="${width}" height="${height}" fill="#ffffff" />
      ${gridLines}
      <line x1="${padding.left}" y1="${padding.top}" x2="${padding.left}" y2="${height - padding.bottom}" stroke="#9ca3af" />
      <line x1="${padding.left}" y1="${height - padding.bottom}" x2="${width - padding.right}" y2="${height - padding.bottom}" stroke="#9ca3af" />
      ${xLabels}
      <polyline fill="none" stroke="#2563eb" stroke-width="3" points="${scorePoints}" />
      <polyline fill="none" stroke="#dc2626" stroke-width="2" points="${mistakePoints}" />
      ${scoreDots}
      ${mistakeDots}
      <g transform="translate(${width - 210}, 20)">
        <line x1="0" y1="0" x2="28" y2="0" stroke="#2563eb" stroke-width="3" />
        <text x="36" y="4" font-size="13" fill="#111827">点数</text>
        <line x1="90" y1="0" x2="118" y2="0" stroke="#dc2626" stroke-width="2" />
        <text x="126" y="4" font-size="13" fill="#111827">ミス数</text>
      </g>
    </svg>
  `
}

function ScoreChartPage({ childrenId, recordTypeId, onBack }) {
  const { databaseState } = useAppState()
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const child = useMemo(
    () => asArray(databaseState?.children)
      .find((row) => Number(row.id) === Number(childrenId)),
    [childrenId, databaseState?.children],
  )

  const recordType = useMemo(
    () => asArray(databaseState?.record_types)
      .find((row) => Number(row.id) === Number(recordTypeId)),
    [databaseState?.record_types, recordTypeId],
  )

  const facilityById = useMemo(
    () => new Map(asArray(databaseState?.facilitys).map((row) => [Number(row.id), row])),
    [databaseState?.facilitys],
  )

  const childTypeName = useMemo(() => {
    const childType = asArray(databaseState?.children_type)
      .find((row) => Number(row.id) === Number(child?.children_type_id))
    return childType?.name ?? ''
  }, [child?.children_type_id, databaseState?.children_type])

  useEffect(() => {
    let cancelled = false

    async function loadGraph() {
      setLoading(true)
      setError('')

      try {
        const result = await getChildKadaiGraph({ childrenId, recordTypeId })

        if (!cancelled) {
          setRecords(result.map((row) => ({
            ...row,
            dateLabel: formatDate(row.date),
            score: Number(row.score ?? 0),
            mistakes: Number(row.mistakes ?? 0),
          })))
        }
      } catch (loadError) {
        console.error('[ScoreChartPage] graph load failed:', loadError)

        if (!cancelled) {
          setRecords([])
          setError(loadError?.message || 'グラフデータの取得に失敗しました。')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadGraph()

    return () => {
      cancelled = true
    }
  }, [childrenId, recordTypeId])

  const handleExport = () => {
    if (!records.length) return

    const childName = child?.name ?? '児童'
    const recordTypeName = recordType?.name ?? recordTypeId
    const exportedAt = new Date().toLocaleString('ja-JP')
    const chartSvg = createChartSvg(records)

    const tableRows = records.map((row) => `
      <tr>
        <td>${escapeHtml(row.dateLabel)}</td>
        <td class="number">${escapeHtml(row.score)}</td>
        <td class="number">${escapeHtml(row.mistakes)}</td>
        <td>${escapeHtml(facilityById.get(Number(row.facility_id))?.name ?? '')}</td>
        <td>${escapeHtml(childTypeName)}</td>
        <td>${escapeHtml(row.memo1)}</td>
        <td>${escapeHtml(row.memo2)}</td>
      </tr>
    `).join('')

    const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(childName)}の課題記録</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; color: #111827; background: #fff; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Yu Gothic", "Meiryo", sans-serif; }
    .container { max-width: 1100px; margin: 0 auto; }
    h1 { margin: 0 0 8px; font-size: 24px; }
    h2 { margin: 32px 0 12px; font-size: 18px; }
    .meta { margin-bottom: 24px; color: #4b5563; font-size: 14px; }
    .chart { width: 100%; overflow-x: auto; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; }
    .chart svg { display: block; width: 100%; min-width: 720px; height: auto; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; vertical-align: top; text-align: left; white-space: pre-wrap; word-break: break-word; }
    th { background: #f3f4f6; font-weight: 600; }
    td.number { text-align: right; }
    .footer { margin-top: 20px; color: #6b7280; font-size: 12px; }
    @media print {
      body { padding: 0; }
      .container { max-width: none; }
      .chart { border: 0; padding: 0; }
      table { font-size: 11px; }
      th, td { padding: 5px 6px; }
    }
  </style>
</head>
<body>
  <main class="container">
    <h1>${escapeHtml(childName)}の課題記録</h1>
    <div class="meta">
      <div>記録タイプ: ${escapeHtml(recordTypeName)}</div>
      <div>件数: ${records.length}件</div>
    </div>

    <h2>グラフ</h2>
    <div class="chart">${chartSvg}</div>

    <h2>記録一覧</h2>
    <table>
      <thead>
        <tr>
          <th>日付</th>
          <th>点数</th>
          <th>ミス数</th>
          <th>施設名</th>
          <th>児童タイプ</th>
          <th>メモ1</th>
          <th>メモ2</th>
        </tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>

    <div class="footer">出力日時: ${escapeHtml(exportedAt)}</div>
  </main>
</body>
</html>`

    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${sanitizeFileName(childName)}_${sanitizeFileName(recordTypeName)}_課題記録.html`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">
            {child?.name ?? '児童'}の課題グラフ
          </h2>
          <p className="text-sm text-gray-600">
            記録タイプ: {recordType?.name ?? recordTypeId}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBack}
            className="rounded bg-gray-500 px-4 py-2 text-sm text-white hover:bg-gray-600"
          >
            一覧へ戻る
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={loading || !!error || records.length === 0}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            出力
          </button>
        </div>
      </div>

      {loading && (
        <div className="py-16 text-center text-gray-500">読み込み中...</div>
      )}

      {!loading && error && (
        <div className="rounded border border-red-300 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && records.length === 0 && (
        <div className="py-16 text-center text-gray-500">
          グラフに表示できる記録がありません。
        </div>
      )}

      {!loading && !error && records.length > 0 && (
        <div className="h-[420px] min-w-0 rounded bg-white p-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={records} margin={{ top: 10, right: 24, left: 0, bottom: 10 }}>
              <CartesianGrid stroke="#d1d5db" strokeDasharray="5 5" />
              <XAxis dataKey="dateLabel" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                name="点数"
                stroke="#2563eb"
                strokeWidth={3}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="mistakes"
                name="ミス数"
                stroke="#dc2626"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </section>
  )
}

export default ScoreChartPage
