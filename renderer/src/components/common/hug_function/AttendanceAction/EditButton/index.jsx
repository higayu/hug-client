import { useCallback, useMemo, useState } from 'react'

import { openAttendanceEditPage } from './function.js'

/**
 * 入退室時刻の編集ボタン。
 *
 * 同じ行から取得した以下2つを直接受け取る。
 * - name         : 児童名
 * - locationHref : HUG本体の location.href の遷移先
 *                  例 attendance.php?mode=edit&id=47534&s_id=1
 *
 * 既存呼び出しとの互換用に childName / editUrl も受け付ける。
 */
export default function EditButton({
  name = '',
  locationHref = '',

  // 旧propsとの互換用
  childName = '',
  editUrl = '',

  webview = null,
  disabled = false,
  title = '',
  onOpened = null,
  onError = null,
}) {
  const [isOpening, setIsOpening] = useState(false)

  // 新しいpropsを優先し、旧propsはフォールバックとして使用する。
  const resolvedName = String(name || childName || '').trim()
  const resolvedLocationHref = String(locationHref || editUrl || '').trim()

  /**
   * 取得結果確認用。
   * 名前と、同じ行から取得した location.href を表示する。
   */
  const resolvedTitle = useMemo(() => {
    if (title) return title

    return [
      `名前: ${resolvedName || '(未取得)'}`,
      `location.href: ${resolvedLocationHref || '(未取得)'}`,
    ].join('\n')
  }, [title, resolvedName, resolvedLocationHref])

  const cannotOpen = disabled || isOpening || !resolvedLocationHref

  const handleClick = useCallback(async () => {
    if (cannotOpen) return

    setIsOpening(true)

    try {
      const result = await openAttendanceEditPage({
        editUrl: resolvedLocationHref,
        webview,
      })

      onOpened?.({
        ...result,
        name: resolvedName,
        locationHref: resolvedLocationHref,
      })
    } catch (error) {
      console.error('[Attendance Edit] 編集画面GET遷移失敗:', {
        name: resolvedName,
        locationHref: resolvedLocationHref,
        error,
      })
      onError?.(error)
    } finally {
      setIsOpening(false)
    }
  }, [
    cannotOpen,
    resolvedLocationHref,
    resolvedName,
    webview,
    onOpened,
    onError,
  ])

  return (
    <button
      type="button"
      className="px-4 py-2 rounded-md bg-gray-300 hover:bg-gray-400 text-gray-800 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 hug-btn-attendance-edit"
      disabled={cannotOpen}
      title={resolvedTitle}
      onClick={handleClick}
    >
      {isOpening ? '移動中...' : '編集'}
    </button>
  )
}
