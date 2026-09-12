import { useAppState } from '@/AppStateContext'
import SelectChildFilter from '../SelectChildFilter'

function formatLastFetchedAt(extractedAt) {
  if (!extractedAt) {
    return {
      dateTime: '未取得',
      time: '未取得',
    }
  }

  const date = new Date(extractedAt)

  if (Number.isNaN(date.getTime())) {
    return {
      dateTime: '未取得',
      time: '未取得',
    }
  }

  return {
    dateTime: date.toLocaleString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    time: date.toLocaleTimeString('ja-JP', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
  }
}

/**
 * 利用者データ取得情報
 *
 * - 最終取得時間
 * - 児童表示フィルター
 */
export default function AttendanceFetchInfo() {
  const { attendanceData } = useAppState()

  const lastFetchedAt = attendanceData?.extractedAt ?? null
  const fetchedAtLabel = formatLastFetchedAt(lastFetchedAt)

  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <div
        className="border border-gray-300 rounded-md bg-white py-1 px-2 flex flex-row gap-2 items-center text-center"
        title={fetchedAtLabel.dateTime}
      >
        <span className="text-sm font-bold text-gray-900">取得：</span>
        <span
          className={`text-xl font-extrabold ${
            lastFetchedAt ? 'text-green-800' : 'text-red-700'
          }`}
        >
          {fetchedAtLabel.time}
        </span>
      </div>

      <SelectChildFilter />
    </div>
  )
}
