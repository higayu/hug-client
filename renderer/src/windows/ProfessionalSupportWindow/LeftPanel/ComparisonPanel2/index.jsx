import { useMemo } from 'react'

import { useAppState } from '@/AppStateContext'

import ChildView from './ChildView'
import { buildCalendar, getIssueLabel } from './helpers'

export default function ComparisonPanel2({
  loading,
  error,
  data,
  records = [],
  facilityId,
  targetMonth,
  personalRecordRefreshKey = 0,
}) {
  const { DEBUG_FLG } = useAppState()

  const rows = Array.isArray(data) ? data : []

  const calendar = useMemo(() => buildCalendar(rows), [rows])

  const issueCount = useMemo(
    () => rows.filter((row) => getIssueLabel(row) !== 'OK').length,
    [rows],
  )

  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
        月次比較データを取得しています...
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        DBに保存済みの月次比較データがありません。
      </div>
    )
  }

  return (
    <div className="space-y-3" role="tabpanel" aria-label="月次比較">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            {calendar
              ? `${calendar.year}年${String(calendar.month).padStart(2, '0')}月の専門的支援比較`
              : '専門的支援 月次比較'}
          </h2>

          <p className="mt-1 text-xs text-gray-500">
            児童ごとの月間集計を確認し、行をクリックすると日別詳細を展開できます。
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
            {rows.length}件
          </span>

          {DEBUG_FLG && issueCount > 0 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 font-semibold text-amber-800">
              要確認 {issueCount}件
            </span>
          )}
        </div>
      </div>

      <ChildView
        data={rows}
        records={records}
        facilityId={facilityId}
        targetMonth={targetMonth}
        personalRecordRefreshKey={personalRecordRefreshKey}
      />

      <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
        <span className="rounded bg-blue-100 px-2 py-1 text-blue-700">
          加算 = 加算数データ
        </span>
        <span className="rounded bg-indigo-100 px-2 py-1 text-indigo-700">
          一覧 = 加算一覧データ
        </span>
        <span className="rounded bg-emerald-100 px-2 py-1 text-emerald-700">
          個人記録 = Laravel保存済みデータ
        </span>
        <span className="rounded bg-red-100 px-2 py-1 text-red-700">
          加算なし
        </span>
        <span className="rounded bg-amber-100 px-2 py-1 text-amber-800">
          一覧なし
        </span>
      </div>
    </div>
  )
}
