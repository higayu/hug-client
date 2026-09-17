const badgeClass = (active, type = 'default') => {
  if (!active) {
    return 'bg-gray-100 text-gray-400'
  }

  if (type === 'success') {
    return 'bg-green-100 text-green-700'
  }

  if (type === 'warning') {
    return 'bg-yellow-100 text-yellow-800'
  }

  if (type === 'danger') {
    return 'bg-red-100 text-red-700'
  }

  return 'bg-blue-100 text-blue-700'
}

const getIssueLabel = (row) => {
  if (Number(row.missing_addition) === 1) {
    return '加算なし'
  }

  if (Number(row.missing_record) === 1) {
    return '一覧なし'
  }

  if (Number(row.record_without_addition) === 1) {
    return '加算一覧のみ'
  }

  return 'OK'
}

export default function ComparisonPanel({
  loading,
  error,
  data,
}) {
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

  const rows = Array.isArray(data) ? data : []

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
        DBに保存済みの月次比較データがありません。
      </div>
    )
  }

  const issueCount = rows.filter(
    (row) =>
      Number(row.missing_addition) === 1 ||
      Number(row.missing_record) === 1 ||
      Number(row.record_without_addition) === 1,
  ).length

  return (
    <div className="space-y-3" role="tabpanel" aria-label="月次比較">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            月次比較
          </h2>
          <p className="mt-1 text-xs text-gray-500">
            施設・日付・児童名を基準に3種類の保存データを比較します。
          </p>
        </div>

        <div className="flex gap-2 text-xs">
          <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
            {rows.length}件
          </span>
          <span
            className={`rounded-full px-3 py-1 font-semibold ${
              issueCount > 0
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            不整合 {issueCount}件
          </span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-xs">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 font-medium">日付</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">児童名</th>
              <th className="whitespace-nowrap px-3 py-2 text-center font-medium">出席</th>
              <th className="whitespace-nowrap px-3 py-2 text-center font-medium">加算数</th>
              <th className="whitespace-nowrap px-3 py-2 text-center font-medium">加算一覧</th>
              <th className="whitespace-nowrap px-3 py-2 font-medium">加算内容</th>
              <th className="whitespace-nowrap px-3 py-2 text-center font-medium">判定</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
            {rows.map((row, index) => {
              const hasAttendance = Number(row.has_attendance) === 1
              const hasAddition = Number(row.has_addition) === 1
              const hasRecord = Number(row.has_record) === 1
              const issueLabel = getIssueLabel(row)
              const hasIssue = issueLabel !== 'OK'

              return (
                <tr
                  key={`${row.facility_id}-${row.target_date}-${row.child_name_key || row.child_name}-${index}`}
                  className={hasIssue ? 'bg-red-50/40' : undefined}
                >
                  <td className="whitespace-nowrap px-3 py-2">
                    {row.target_date || '-'}
                  </td>

                  <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                    {row.child_name || '-'}
                  </td>

                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <span
                      className={`rounded px-2 py-1 font-semibold ${badgeClass(
                        hasAttendance,
                        hasAttendance && Number(row.is_absent) === 0
                          ? 'success'
                          : 'danger',
                      )}`}
                    >
                      {hasAttendance
                        ? row.attendance_status || (Number(row.is_absent) === 1 ? '欠席' : 'あり')
                        : 'なし'}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <span
                      className={`rounded px-2 py-1 font-semibold ${badgeClass(
                        hasAddition,
                        'success',
                      )}`}
                    >
                      {hasAddition ? `${row.addition_count ?? 0}件` : 'なし'}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <span
                      className={`rounded px-2 py-1 font-semibold ${badgeClass(
                        hasRecord,
                        'success',
                      )}`}
                    >
                      {hasRecord ? `${row.record_count ?? 0}件` : 'なし'}
                    </span>
                  </td>

                  <td className="max-w-[260px] px-3 py-2">
                    <div className="space-y-1">
                      {row.addition_names && (
                        <p>
                          <span className="text-gray-400">加算数:</span>{' '}
                          {row.addition_names}
                        </p>
                      )}
                      {row.record_addition_names && (
                        <p>
                          <span className="text-gray-400">一覧:</span>{' '}
                          {row.record_addition_names}
                        </p>
                      )}
                      {!row.addition_names && !row.record_addition_names && '-'}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    <span
                      className={`rounded px-2 py-1 font-semibold ${
                        hasIssue
                          ? 'bg-red-100 text-red-700'
                          : 'bg-green-100 text-green-700'
                      }`}
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
    </div>
  )
}
