import {
  formatMonthDay,
  getRecordStatus,
  hasProfessionalSupportAddition,
} from '../../../DateView/utils'

export default function MonthlySummaryRow({
  item,
  expanded,
  onToggle,
  recordStatusMap,
}) {
  const attendanceCount = Number(item.attendanceCount) || 0
  const additionCount = Number(item.additionCount) || 0
  const recordCount = Number(item.recordCount) || 0

  const isAdditionWarning =
    (attendanceCount >= 2 && additionCount < 2) ||
    (attendanceCount === 1 && additionCount === 0)

  const isRecordWarning =
    (attendanceCount >= 2 && recordCount < 2) ||
    (attendanceCount === 1 && recordCount === 0)

  const hasWarning = isAdditionWarning || isRecordWarning
  const childRows = Array.isArray(item.rows) ? item.rows : []

  return (
    <>
      <tr
        className={`cursor-pointer transition ${
          hasWarning
            ? 'bg-red-50 hover:bg-red-100'
            : 'hover:bg-gray-50'
        }`}
        onClick={onToggle}
        aria-expanded={expanded}
      >
        <td className="px-4 py-2.5 font-medium text-gray-900">
          <div className="flex items-center gap-2">
            <span className="inline-block w-4 text-center text-xs text-gray-400">
              {expanded ? '▼' : '▶'}
            </span>
            <span>{item.childName}</span>
          </div>
        </td>

        <td className="px-4 py-2.5 text-center font-semibold text-gray-700">
          {attendanceCount}
        </td>

        <td className="px-4 py-2.5 text-center">
          <span
            className={
              isAdditionWarning
                ? 'text-lg font-black tabular-nums text-red-600'
                : 'font-semibold tabular-nums text-blue-700'
            }
          >
            {additionCount}
          </span>
        </td>

        <td className="px-4 py-2.5 text-center">
          <span
            className={
              isRecordWarning
                ? 'text-lg font-black tabular-nums text-red-600'
                : 'font-semibold tabular-nums text-indigo-700'
            }
          >
            {recordCount}
          </span>
        </td>
      </tr>

      {expanded && (
        <tr>
          <td colSpan={4} className="bg-gray-50 p-0">
            <div className="border-t border-gray-200 px-6 py-3">
              <div className="overflow-x-auto rounded border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50 text-left text-gray-500">
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
                    {childRows.map((row, index) => {
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
            </div>
          </td>
        </tr>
      )}
    </>
  )
}
