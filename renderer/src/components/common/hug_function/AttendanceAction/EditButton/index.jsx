import { useCallback } from 'react'

/**
 * 入退室時刻の編集ボタン。
 * 現時点では表示のみ実装し、クリック時の内部処理は未実装。
 */
export default function EditButton({
  disabled = false,
  title = '入退室時間を編集',
}) {
  const handleClick = useCallback(() => {
    // TODO: 編集処理は後で実装する
  }, [])

  return (
    <button
      type="button"
      className="hug-btn-attendance-edit"
      disabled={disabled}
      title={title}
      onClick={handleClick}
    >
      編集
    </button>
  )
}
