import { useMemo } from 'react'

import { groupByChild } from '../helpers'
import {
  buildRecordStatusMap,
  formatMonthDay,
  getRecordStatus,
  hasProfessionalSupportAddition,
} from '../DateView/utils'

export default function ChildView({ data, records }) {
  const rows = Array.isArray(data) ? data : []

  const attendedRows = useMemo(
    () => rows.filter((row) => Number(row?.is_attended) === 1),
    [rows],
  )

  const recordStatusMap = useMemo(
    () => buildRecordStatusMap(records),
    [records],
  )

  const children = useMemo(
    () => groupByChild(attendedRows),
    [attendedRows],
  )

  if (children.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        出席データがありません。
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {children.map((child) => {
        const additionCount = child.rows.filter((row) =>
          hasProfessionalSupportAddition(row),
        ).length

        const recordCount = child.rows.filter((row) =>
          Boolean(getRecordStatus({ row, recordStatusMap })),
        ).length

        return (
          <section
            key={child.key}
            className="overflow-hidden rounded-lg border border-gray-200 bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-200 bg-gray-50 px-4 py-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  {child.childName}
                </h3>
                <p className="mt-0.5 text-[11px] text-gray-500">
                  出席 {child.rows.length}日 / 加算登録 {additionCount}件 / 専門的支援一覧 {recordCount}件
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-white text-left text-gray-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      日付
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 text-center font-medium">
                      加算登録
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      専門的支援一覧
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {child.rows.map((row, index) => {
                    const hasAddition = hasProfessionalSupportAddition(row)
                    const recordStatus = getRecordStatus({
                      row,
                      recordStatusMap,
                    })

                    return (
                      <tr
                        key={`${row.target_date}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                          {formatMonthDay(row.target_date)}
                        </td>

                        <td className="px-3 py-2 text-center">
                          {hasAddition ? (
                            <span className="text-lg font-bold text-green-600">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>

                        <td className="px-3 py-2">
                          {recordStatus ? (
                            <span className="font-medium text-gray-700">
                              {recordStatus}
                            </span>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}
