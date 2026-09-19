import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'

import { useServiceRecord } from '@/hooks/useServiceRecord'
import { setServiceRecord } from '@/store/slices/databaseSlice.js'

/**
 * Laravel から対象施設・対象月の個人記録を全件取得して表示するコンポーネント。
 * children_id を検索条件には使用しない。
 *
 * props:
 * - facilityId: 施設ID
 * - targetMonth: YYYY-MM
 * - reloadSeq: 再取得したいときに増加させる任意の値
 * - onLoadingChange: loading 状態を親へ通知する任意コールバック
 * - onError: エラー内容を親へ通知する任意コールバック
 * - onLoaded: 取得結果を親へ通知する任意コールバック
 */
export default function PersonalRecordLaravelLoader({
  facilityId,
  targetMonth,
  reloadSeq = 0,
  onLoadingChange,
  onError,
  onLoaded,
}) {
  const dispatch = useDispatch()
  const { getServiceRecordMonthly } = useServiceRecord()

  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const normalizedFacilityId = Number(facilityId)
    const normalizedTargetMonth = String(targetMonth ?? '').trim()

    if (
      !/^\d{4}-\d{2}$/.test(normalizedTargetMonth) ||
      !Number.isInteger(normalizedFacilityId) ||
      normalizedFacilityId <= 0
    ) {
      setRecords([])
      setError('')
      dispatch(setServiceRecord([]))
      onError?.('')
      onLoaded?.([])
      return
    }

    let cancelled = false

    const loadServiceRecords = async () => {
      setLoading(true)
      setError('')
      onLoadingChange?.(true)
      onError?.('')

      try {
        const result = await getServiceRecordMonthly({
          target_month: normalizedTargetMonth,
          day_of_week_id: null,
          facility_id: normalizedFacilityId,
          item_id: 1,
        })

        if (cancelled) return

        const rows = Array.isArray(result)
          ? result
          : Array.isArray(result?.data)
            ? result.data
            : []

        console.log(
          '[PersonalRecordLaravelLoader] Laravel個人記録 全件:',
          rows,
        )

        setRecords(rows)
        dispatch(setServiceRecord(rows))
        onLoaded?.(rows)
      } catch (loadError) {
        if (cancelled) return

        console.error(
          '[PersonalRecordLaravelLoader] 個人記録の取得に失敗しました。',
          loadError,
        )

        const message =
          loadError?.message || 'Laravelから個人記録を取得できませんでした。'

        setRecords([])
        dispatch(setServiceRecord([]))
        setError(message)
        onError?.(message)
        onLoaded?.([])
      } finally {
        if (!cancelled) {
          setLoading(false)
          onLoadingChange?.(false)
        }
      }
    }

    loadServiceRecords()

    return () => {
      cancelled = true
    }
  }, [
    dispatch,
    facilityId,
    getServiceRecordMonthly,
    onError,
    onLoaded,
    onLoadingChange,
    reloadSeq,
    targetMonth,
  ])

  if (loading) {
    return (
      <div className="rounded-lg border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-700">
        Laravelから個人記録を取得しています...
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

  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm text-gray-500">
        対象月の個人記録はありません。
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Laravel 個人記録一覧
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            対象施設・対象月の個人記録を児童で絞り込まず全件表示しています。
          </p>
        </div>

        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
          {records.length}件
        </span>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-600">
                ID
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-600">
                児童ID
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-600">
                日付
              </th>
              <th className="min-w-[420px] px-3 py-2 text-left text-xs font-semibold text-gray-600">
                個人記録
              </th>
              <th className="whitespace-nowrap px-3 py-2 text-left text-xs font-semibold text-gray-600">
                記録職員ID
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100 bg-white">
            {records.map((record, index) => (
              <tr
                key={
                  record?.id ??
                  `${record?.children_id ?? 'child'}-${record?.served_date ?? 'date'}-${index}`
                }
                className="align-top hover:bg-gray-50"
              >
                <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                  {record?.id ?? '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                  {record?.children_id ?? '-'}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-700">
                  {record?.served_date ?? '-'}
                </td>
                <td className="whitespace-pre-wrap break-words px-3 py-2 text-gray-900">
                  {record?.note ?? ''}
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-600">
                  {record?.recorded_staff_id ?? '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
