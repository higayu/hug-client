import { useMemo } from 'react'

import {
  WEEKDAYS,
  buildCalendar,
  makeDateKey,
} from '../helpers'
import {
  buildRecordStatusMap,
  getRecordStatus,
  hasProfessionalSupportAddition,
} from '../DateView/utils'

function ComparisonChildRow({ row, recordStatusMap }) {
  const hasAddition = hasProfessionalSupportAddition(row)
  const recordStatus = getRecordStatus({ row, recordStatusMap })

  return (
    <li className="border-t border-gray-100 bg-white px-2 py-1.5 first:border-t-0">
      <div className="min-w-0 break-words font-medium text-gray-800">
        {row.child_name || '-'}
      </div>

      <div className="mt-1 flex flex-wrap gap-1 text-[10px]">
        <span
          className={`rounded px-1.5 py-0.5 font-semibold ${
            hasAddition
              ? 'bg-green-100 text-green-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          加算 {hasAddition ? '✓' : '-'}
        </span>

        <span
          className={`rounded px-1.5 py-0.5 font-semibold ${
            recordStatus
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-gray-100 text-gray-400'
          }`}
        >
          一覧 {recordStatus || '-'}
        </span>
      </div>
    </li>
  )
}

export default function CalendarView({ data, records }) {
  const rows = Array.isArray(data) ? data : []

  const attendedRows = useMemo(
    () => rows.filter((row) => Number(row?.is_attended) === 1),
    [rows],
  )

  const recordStatusMap = useMemo(
    () => buildRecordStatusMap(records),
    [records],
  )

  const calendar = useMemo(
    () => buildCalendar(attendedRows),
    [attendedRows],
  )

  if (!calendar) {
    return (
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
        出席データの日付を解析できませんでした。
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
            const isToday = cell.dateKey === todayKey

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

                  {cell.rows.length > 0 && (
                    <span className="text-[10px] font-semibold text-gray-500">
                      {cell.rows.length}名
                    </span>
                  )}
                </div>

                <div className="p-1.5">
                  {cell.rows.length === 0 ? (
                    <div className="flex min-h-24 items-center justify-center text-[11px] text-gray-300">
                      出席なし
                    </div>
                  ) : (
                    <section className="overflow-hidden rounded border border-gray-200 bg-white">
                      <div className="flex items-center justify-between bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
                        <span>出席</span>
                        <span>{cell.rows.length}人</span>
                      </div>

                      <ul>
                        {cell.rows
                          .slice()
                          .sort((a, b) =>
                            String(a?.child_name || '').localeCompare(
                              String(b?.child_name || ''),
                              'ja',
                            ),
                          )
                          .map((row, rowIndex) => (
                            <ComparisonChildRow
                              key={`${row.facility_id}-${row.target_date}-${row.child_name_key || row.child_name}-${rowIndex}`}
                              row={row}
                              recordStatusMap={recordStatusMap}
                            />
                          ))}
                      </ul>
                    </section>
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
