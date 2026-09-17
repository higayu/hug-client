import {
  WEEKDAYS,
  buildCalendar,
  getIssueClass,
  getIssueLabel,
  getStatusClass,
  groupByAttendanceStatus,
  makeDateKey,
  normalizeNumber,
} from '../helpers'

function ComparisonChildRow({ row }) {
  const hasAddition = normalizeNumber(row.has_addition) === 1
  const hasRecord = normalizeNumber(row.has_record) === 1
  const issueLabel = getIssueLabel(row)
  const hasIssue = issueLabel !== 'OK'

  return (
    <li
      className={`border-t border-gray-100 px-2 py-1.5 first:border-t-0 ${
        hasIssue ? 'bg-red-50/40' : 'bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-1">
        <span className="min-w-0 flex-1 break-words font-medium text-gray-800">
          {row.child_name || '-'}
        </span>

        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${getIssueClass(
            row,
          )}`}
        >
          {issueLabel}
        </span>
      </div>

      <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
        <span
          className={`rounded px-1.5 py-0.5 font-semibold ${
            hasAddition
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          加算 {hasAddition ? `${row.addition_count ?? 0}件` : 'なし'}
        </span>

        <span
          className={`rounded px-1.5 py-0.5 font-semibold ${
            hasRecord
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          一覧 {hasRecord ? `${row.record_count ?? 0}件` : 'なし'}
        </span>
      </div>
    </li>
  )
}

function AttendanceGroup({ label, rows }) {
  if (!rows.length) {
    return null
  }

  return (
    <section className="overflow-hidden rounded border border-gray-200 bg-white">
      <div
        className={`flex items-center justify-between px-2 py-1 text-[11px] font-semibold ${getStatusClass(
          label,
        )}`}
      >
        <span>{label}</span>
        <span>{rows.length}人</span>
      </div>

      <ul>
        {rows.map((row, index) => (
          <ComparisonChildRow
            key={`${row.facility_id}-${row.target_date}-${row.child_name_key || row.child_name}-${index}`}
            row={row}
          />
        ))}
      </ul>
    </section>
  )
}

export default function CalendarView({ data }) {
  const rows = Array.isArray(data) ? data : []
  const calendar = buildCalendar(rows)

  if (!calendar) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        月次比較データの日付を解析できませんでした。
      </div>
    )
  }

  const today = new Date()
  const todayKey = makeDateKey(
    today.getFullYear(),
    today.getMonth() + 1,
    today.getDate(),
  )

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-300 bg-white">
      <div className="min-w-[1120px]">
        <div className="grid grid-cols-7 border-b border-gray-300 bg-gray-50 text-center text-xs font-semibold">
          {WEEKDAYS.map((weekday, index) => (
            <div
              key={weekday}
              className={`border-r border-gray-300 px-2 py-2 last:border-r-0 ${
                index === 0
                  ? 'text-red-600'
                  : index === 6
                    ? 'text-blue-600'
                    : 'text-gray-700'
              }`}
            >
              {weekday}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {calendar.cells.map((cell, index) => {
            if (!cell) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-40 border-b border-r border-gray-200 bg-gray-50"
                />
              )
            }

            const weekday = index % 7
            const groups = groupByAttendanceStatus(cell.rows)
            const isToday = cell.dateKey === todayKey
            const dayIssueCount = cell.rows.filter(
              (row) => getIssueLabel(row) !== 'OK',
            ).length

            return (
              <div
                key={cell.dateKey}
                className={`min-h-40 border-b border-r border-gray-200 align-top ${
                  isToday ? 'bg-blue-50/40' : 'bg-white'
                }`}
              >
                <div
                  className={`flex items-start justify-between border-b px-2 py-1.5 ${
                    isToday
                      ? 'border-blue-200 bg-blue-100'
                      : 'border-gray-100'
                  }`}
                >
                  <div>
                    <span
                      className={`text-sm font-bold ${
                        weekday === 0
                          ? 'text-red-600'
                          : weekday === 6
                            ? 'text-blue-600'
                            : 'text-gray-800'
                      }`}
                    >
                      {cell.day}
                    </span>

                    <span className="ml-1 text-[10px] text-gray-400">
                      ({WEEKDAYS[weekday]})
                    </span>
                  </div>

                  {dayIssueCount > 0 && (
                    <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-semibold text-red-700">
                      不整合 {dayIssueCount}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 p-1.5">
                  {cell.rows.length === 0 ? (
                    <div className="flex min-h-24 items-center justify-center text-[11px] text-gray-300">
                      データなし
                    </div>
                  ) : (
                    <>
                      <AttendanceGroup label="出席" rows={groups.出席} />
                      <AttendanceGroup label="欠席" rows={groups.欠席} />
                      <AttendanceGroup
                        label="欠席（加算なし）"
                        rows={groups['欠席（加算なし）']}
                      />
                      <AttendanceGroup label="その他" rows={groups.その他} />
                    </>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
