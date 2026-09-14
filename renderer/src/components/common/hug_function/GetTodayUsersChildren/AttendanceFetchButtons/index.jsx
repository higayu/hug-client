import { FaRobot, FaPowerOff, FaChild } from 'react-icons/fa'

/**
 * 利用者データ取得ボタン
 *
 * - Auto 取得の ON / OFF
 * - 手動取得
 *
 * 取得処理そのものは親コンポーネントで管理し、
 * このコンポーネントはボタン表示とイベント通知だけを担当する。
 */
export default function AttendanceFetchButtons({
  autoFetchEnabled,
  onToggleAutoFetch,
  onFetch,
}) {
  return (
    <div className="flex flex-col gap-2 items-center justify-center">
      <button
        type="button"
        title="自動取得"
        className={
          autoFetchEnabled
            ? 'btn-purple hover:bg-purple-600 p-2 rounded text-white text-xs shrink-0 flex items-center gap-1'
            : 'bg-gray-400 hover:bg-gray-500 p-2 rounded text-white text-xs shrink-0 flex items-center gap-1'
        }
        onClick={onToggleAutoFetch}
      >
        {autoFetchEnabled ? <FaRobot size={14} /> : <FaPowerOff size={14} />}
        Auto
      </button>

      <div className="flex items-center justify-center">
        <button
          type="button"
          onClick={onFetch}
          title="今日の利用者のデータ取得"
          className="flex items-center justify-center px-7 py-2 gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md"
        >
          <FaChild size={16} />
        </button>
      </div>
    </div>
  )
}
