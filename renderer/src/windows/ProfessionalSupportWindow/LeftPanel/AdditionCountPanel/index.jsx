const getTodayDate = () => {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export default function AdditionCountPanel({
  loading,
  error,
  additionCountData,
}) {
  const todayDate = getTodayDate()

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-gray-500">
        加算数データを取得しています...
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

  if (!additionCountData) {
    return null
  }

  return (
    <div role="tabpanel" aria-label="加算数データ">
      <h2 className="mb-3 text-base font-semibold text-gray-700">
        {additionCountData.heading || '月間加算数データ'}
      </h2>

      <div className="space-y-3">
        {additionCountData.days.map((day) => {
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

                <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-semibold text-blue-800">
                  専門的支援実施加算 {day.professionalSupportCount}人
                </span>
              </div>

              {day.professionalSupportChildren.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {day.professionalSupportChildren.map((name, index) => (
                    <li
                      key={`${day.date}-professional-support-${name}-${index}`}
                      className="rounded bg-blue-50 px-2 py-1 text-sm text-gray-700"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}

              {day.additions.length > 1 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-2 text-xs font-semibold text-gray-500">
                    その他の加算
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {day.additions
                      .filter((addition) => addition.name !== '専門的支援実施加算')
                      .map((addition) => (
                        <span
                          key={`${day.date}-${addition.name}`}
                          className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
                        >
                          {addition.name} {addition.count}人
                        </span>
                      ))}
                  </div>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </div>
  )
}
