const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function AttendancePanel({
  loading,
  error,
  attendanceData,
}) {
  const todayDate = getTodayDate()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        出席データを取得しています...
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

  if (!attendanceData) {
    return null
  }

  return (
    <div role="tabpanel" aria-label="出席データ">
      <h2 className="mb-3 text-base font-semibold text-gray-700">
        {attendanceData.heading || '月間出席データ'}
      </h2>

      <div className="space-y-3">
        {attendanceData.days.map((day) => {
          const isToday = day.date === todayDate

          return (
            <article
              key={day.date}
              className={`rounded-lg border p-4 ${
                isToday
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <h3 className="font-medium text-gray-800">
                  {day.date}
                </h3>

                <div className="flex flex-wrap justify-end gap-2">
                  <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-800">
                    出席 {day.attendanceCount}人
                  </span>

                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-semibold text-red-700">
                    欠席 {day.absenceCount}人
                  </span>

                  <span className="rounded-full bg-orange-100 px-3 py-1 text-sm font-semibold text-orange-700">
                    欠席（加算なし） {day.absenceWithoutAdditionCount}人
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <p className="mb-1 text-xs font-semibold text-green-700">
                  出席者
                </p>

                {day.attendanceNames.length > 0 ? (
                  <ul className="flex flex-wrap gap-2">
                    {day.attendanceNames.map((name, index) => (
                      <li
                        key={`${day.date}-attendance-${name}-${index}`}
                        className="rounded bg-green-50 px-2 py-1 text-sm text-gray-700"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">
                    出席者なし
                  </p>
                )}
              </div>

              {day.absenceNames.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-1 text-xs font-semibold text-red-600">
                    欠席者
                  </p>

                  <ul className="flex flex-wrap gap-2">
                    {day.absenceNames.map((name, index) => (
                      <li
                        key={`${day.date}-absence-${name}-${index}`}
                        className="rounded bg-red-50 px-2 py-1 text-sm text-red-700"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {day.absenceWithoutAdditionNames.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-1 text-xs font-semibold text-orange-600">
                    欠席者（加算なし）
                  </p>

                  <ul className="flex flex-wrap gap-2">
                    {day.absenceWithoutAdditionNames.map((name, index) => (
                      <li
                        key={`${day.date}-absence-without-addition-${name}-${index}`}
                        className="rounded bg-orange-50 px-2 py-1 text-sm text-orange-700"
                      >
                        {name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
