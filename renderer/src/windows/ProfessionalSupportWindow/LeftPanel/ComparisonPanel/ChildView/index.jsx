import {
  getIssueClass,
  getIssueLabel,
  getStatusClass,
  groupByChild,
  normalizeNumber,
} from '../helpers'

export default function ChildView({ data }) {
  const rows = Array.isArray(data) ? data : []
  const children = groupByChild(rows)

  return (
    <div className="space-y-3">
      {children.map((child) => {
        const issueCount = child.rows.filter(
          (row) => getIssueLabel(row) !== 'OK',
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
                  月内 {child.rows.length}件
                </p>
              </div>

              <span
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                  issueCount > 0
                    ? 'bg-red-100 text-red-700'
                    : 'bg-green-100 text-green-700'
                }`}
              >
                {issueCount > 0 ? `不整合 ${issueCount}件` : '問題なし'}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-xs">
                <thead className="bg-white text-left text-gray-500">
                  <tr>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      日付
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      出席
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      加算数
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      加算一覧
                    </th>
                    <th className="whitespace-nowrap px-3 py-2 font-medium">
                      判定
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {child.rows.map((row, index) => {
                    const hasAddition =
                      normalizeNumber(row.has_addition) === 1
                    const hasRecord =
                      normalizeNumber(row.has_record) === 1
                    const issueLabel = getIssueLabel(row)

                    return (
                      <tr
                        key={`${row.target_date}-${index}`}
                        className={
                          issueLabel !== 'OK' ? 'bg-red-50/40' : undefined
                        }
                      >
                        <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                          {row.target_date || '-'}
                        </td>

                        <td className="whitespace-nowrap px-3 py-2">
                          <span
                            className={`rounded px-2 py-1 font-semibold ${getStatusClass(
                              row.attendance_status || 'その他',
                            )}`}
                          >
                            {row.attendance_status || 'なし'}
                          </span>
                        </td>

                        <td className="px-3 py-2">
                          <div>
                            <span
                              className={`rounded px-2 py-1 font-semibold ${
                                hasAddition
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {hasAddition
                                ? `${row.addition_count ?? 0}件`
                                : 'なし'}
                            </span>

                            {row.addition_names && (
                              <p className="mt-1 max-w-[260px] break-words text-[11px] text-gray-500">
                                {row.addition_names}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="px-3 py-2">
                          <div>
                            <span
                              className={`rounded px-2 py-1 font-semibold ${
                                hasRecord
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              {hasRecord
                                ? `${row.record_count ?? 0}件`
                                : 'なし'}
                            </span>

                            {row.record_addition_names && (
                              <p className="mt-1 max-w-[260px] break-words text-[11px] text-gray-500">
                                {row.record_addition_names}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-3 py-2">
                          <span
                            className={`rounded px-2 py-1 font-semibold ${getIssueClass(
                              row,
                            )}`}
                          >
                            {issueLabel}
                          </span>
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
