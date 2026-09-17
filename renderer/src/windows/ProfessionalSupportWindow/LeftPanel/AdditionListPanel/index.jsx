const formatCount = (count) => `${Number(count ?? 0)}件`

export default function AdditionListPanel({
  loading,
  error,
  additionListData,
  targetDate,
}) {
  if (loading) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
        専門的支援一覧を取得しています...
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

  if (!additionListData) {
    return (
      <div className="flex min-h-48 items-center justify-center text-sm text-gray-500">
        一覧データがありません。
      </div>
    )
  }

  const records = additionListData.records ?? []
  const periodText =
    additionListData.startDate && additionListData.endDate
      ? `${additionListData.startDate} ～ ${additionListData.endDate}`
      : targetDate || ''

  return (
    <div className="space-y-3" role="tabpanel" aria-label="加算一覧データ">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-gray-800">
            専門的支援実施加算 一覧
          </h2>
          <p className="mt-1 text-xs text-gray-500">{periodText}</p>
        </div>

        <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {formatCount(additionListData.total ?? records.length)}
        </div>
      </div>

      {records.length === 0 ? (
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
          対象期間の専門的支援実施加算はありません。
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200 text-xs">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="whitespace-nowrap px-3 py-2 font-medium">実施日</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">児童名</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">施設</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">利用サービス</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">記録者</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">ステータス</th>
                <th className="whitespace-nowrap px-3 py-2 text-center font-medium">サイン</th>
                <th className="whitespace-nowrap px-3 py-2 font-medium">最終更新</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white text-gray-700">
              {records.map((record, index) => (
                <tr key={`${record.id || 'no-id'}-${record.childName || 'no-child'}-${record.interviewDate || 'no-date'}-${index}`}>
                  <td className="whitespace-nowrap px-3 py-2">{record.interviewDate || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-900">
                    {record.childName || '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{record.facilityName || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-2">{record.serviceName || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-2">{record.recorderName || '-'}</td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <span className="rounded bg-gray-100 px-2 py-1">
                      {record.status || '-'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-center">
                    {record.signed ? '済' : '-'}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">{record.lastUpdated || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
