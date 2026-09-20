export default function ResultPanel({
  error = '',
  sendError = '',
  sendResult = null,
  data = null,
  records = [],
  bulkRecords = [],
  conditionSkippedCount = 0,
  skippedSendCount = 0,
  staffId,
  facilityId,
  getPersonalRecordSkipReason,
  toBulkRecord,
}) {
  return (
    <>
      {error && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {sendError && (
        <div className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {sendError}
        </div>
      )}

      {sendResult?.success && (
        <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          <span className="font-semibold">
            {sendResult.processedCount}件を保存しました。
          </span>
          {sendResult.skippedCount > 0 && (
            <span className="ml-2">
              送信対象外 {sendResult.skippedCount}件
            </span>
          )}
        </div>
      )}

      {data && (
        <div className="mt-3 rounded-lg border border-amber-200 bg-white p-3">
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
              一覧 {records.length}件
            </span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
              本文取得 {data.detailCount ?? 0}件
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-blue-700">
              保存対象 {bulkRecords.length}件
            </span>
            {skippedSendCount > 0 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700">
                保存対象外 {skippedSendCount}件
              </span>
            )}
            {conditionSkippedCount > 0 && (
              <span className="rounded-full bg-purple-50 px-3 py-1 font-semibold text-purple-700">
                条件除外 {conditionSkippedCount}件
              </span>
            )}
            {(data.detailErrorCount ?? 0) > 0 && (
              <span className="rounded-full bg-red-50 px-3 py-1 font-semibold text-red-700">
                本文エラー {data.detailErrorCount}件
              </span>
            )}
            {(data.permissionErrorCount ?? 0) > 0 && (
              <span className="rounded-full bg-orange-50 px-3 py-1 font-semibold text-orange-700">
                権限エラー {data.permissionErrorCount}件
              </span>
            )}
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
              HUG総件数 {data.total ?? records.length}件
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
              {data.startDate} ～ {data.endDate}
            </span>
            <span className="rounded-full bg-gray-100 px-3 py-1 text-gray-600">
              {data.pageCount ?? 1}ページ
            </span>
          </div>

          {records.length === 0 ? (
            <p className="text-sm text-gray-500">
              対象月の個人記録はありませんでした。
            </p>
          ) : (
            <div className="max-h-[32rem] overflow-auto rounded border border-gray-200">
              <table className="min-w-full whitespace-nowrap text-left text-xs">
                <thead className="sticky top-0 z-10 bg-gray-100 text-gray-600">
                  <tr>
                    <th className="px-2 py-2">日付</th>
                    <th className="px-2 py-2">children_id</th>
                    <th className="px-2 py-2">児童名</th>
                    <th className="px-2 py-2">出欠</th>
                    <th className="px-2 py-2">状態</th>
                    <th className="min-w-96 px-2 py-2">個人記録本文</th>
                    <th className="px-2 py-2">本文取得</th>
                    <th className="px-2 py-2">保存対象</th>
                    <th className="px-2 py-2">記録者</th>
                    <th className="px-2 py-2">記録者ID</th>
                    <th className="px-2 py-2">最終更新</th>
                    <th className="px-2 py-2">record_id</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {records.map((record, index) => {
                    const skipReason = getPersonalRecordSkipReason(record)
                    const canSend = Boolean(toBulkRecord(record, facilityId))

                    return (
                      <tr
                        key={
                          record.recordId ||
                          `${record.childrenId}-${record.date}-${index}`
                        }
                        className="align-top hover:bg-gray-50"
                      >
                        <td className="px-2 py-2">{record.date || '-'}</td>
                        <td className="px-2 py-2">{record.childrenId || '-'}</td>
                        <td className="px-2 py-2">{record.childName || '-'}</td>
                        <td className="px-2 py-2">{record.attendance || '-'}</td>
                        <td className="px-2 py-2">{record.status || '-'}</td>
                        <td className="max-w-[36rem] whitespace-pre-wrap break-words px-2 py-2 text-gray-800">
                          {record.note ?? '-'}
                          {record.noteError && (
                            <div className="mt-1 whitespace-normal text-red-600">
                              {record.noteError}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {record.detailSkipped ? (
                            <span className="font-semibold text-purple-600">SKIP</span>
                          ) : record.note !== null && record.note !== undefined ? (
                            <span className="font-semibold text-emerald-600">OK</span>
                          ) : record.permissionError ? (
                            <span className="font-semibold text-orange-600">権限なし</span>
                          ) : (
                            <span className="font-semibold text-red-600">NG</span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {canSend ? (
                            <span className="font-semibold text-blue-600">対象</span>
                          ) : (
                            <div>
                              <span className="font-semibold text-gray-400">除外</span>
                              {(skipReason || record.detailSkipReason) && (
                                <div className="mt-1 max-w-40 whitespace-normal text-[10px] text-purple-600">
                                  {skipReason || record.detailSkipReason}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {record.recordStaffName || record.recorder || '-'}
                        </td>
                        <td className="px-2 py-2">
                          {record.recordStaffId ?? '-'}
                        </td>
                        <td className="px-2 py-2">{record.updatedAt || '-'}</td>
                        <td className="px-2 py-2">{record.recordId || '-'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-gray-600">
              Laravel送信JSONを表示
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded bg-slate-900 p-3 text-xs text-slate-100">
              {JSON.stringify(
                {
                  records: bulkRecords,
                  ...(Number.isInteger(Number(staffId)) && Number(staffId) > 0
                    ? {
                        updated_staff_id: Number(staffId),
                      }
                    : {}),
                },
                null,
                2,
              )}
            </pre>
          </details>

          <details className="mt-3">
            <summary className="cursor-pointer text-xs font-semibold text-gray-600">
              取得JSONを表示
            </summary>
            <pre className="mt-2 max-h-80 overflow-auto rounded bg-gray-900 p-3 text-xs text-gray-100">
              {JSON.stringify(data, null, 2)}
            </pre>
          </details>
        </div>
      )}
    </>
  )
}
