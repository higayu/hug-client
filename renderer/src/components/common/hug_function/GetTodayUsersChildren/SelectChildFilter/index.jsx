import { useAppState } from '@/AppStateContext'

export default function SelectChildFilter() {
  const {
    SELECT_CHILD_FILTER_MODE,
    setSelectChildFilterMode,
  } = useAppState()

  return (
    <div>
      <select
        className="p-1 border border-gray-300 rounded text-sm bg-white text-black"
        value={String(SELECT_CHILD_FILTER_MODE ?? 1)} // 初期値を 1 に変更
        onChange={(e) => setSelectChildFilterMode(Number(e.target.value))}
      >
        <option value="0">全件表示</option>
        <option value="1">選択施設</option> {/* 新規追加 */}
        <option value="2">欠席を除く</option>   {/* 元の1 → 2 */}
        <option value="3">欠席・午前を除く</option> {/* 元の2 → 3 */}
        <option value="4">欠席・午前・退室済みを除く</option> {/* 元の3 → 4 */}
      </select>
    </div>
  )
}