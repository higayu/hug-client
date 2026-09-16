import { useAppState } from '@/AppStateContext'

/**
 * SimpleBoard の AttendanceDataTable に対する表示フィルタ。
 *
 * HUGから取得するデータ自体は変更せず、
 * 取得済み rows の表示だけを切り替える。
 */
export default function SelectChildFilter() {
  const {
    SELECT_CHILD_FILTER_MODE,
    setSelectChildFilterMode,
  } = useAppState()

  return (
    <div>
      <select
        className="p-1 border border-gray-300 rounded text-sm bg-white text-black"
        value={String(SELECT_CHILD_FILTER_MODE ?? 0)}
        onChange={(e) =>
          setSelectChildFilterMode(
            Number(e.target.value)
          )
        }
      >
        <option value="0">全件</option>
        <option value="1">退室済み以外</option>
        <option value="2">退室済みと欠席以外</option>
        <option value="3">欠席</option>
        <option value="4">退室済み</option>
      </select>
    </div>
  )
}
