export default function MonthlySummaryRow({ item }) {
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

  return (
    <tr
      className={
        hasWarning
          ? 'bg-red-50 hover:bg-red-100'
          : 'hover:bg-gray-50'
      }
    >
      <td className="px-4 py-2.5 font-medium text-gray-900">
        {item.childName}
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
  )
}
