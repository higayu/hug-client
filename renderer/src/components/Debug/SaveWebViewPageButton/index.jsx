import { useCallback, useState } from 'react'

/**
 * TaskWindowから渡された参照のみを使用する。
 * 他のWebViewを検索して代替保存することはしない。
 */
export async function saveActiveWebviewCompletePage(getWebview) {
  if (typeof getWebview !== 'function') {
    throw new Error('選択中のWebView取得関数が設定されていません。')
  }
  const webview = getWebview()
  if (!webview?.isConnected || typeof webview.getWebContentsId !== 'function') {
    throw new Error('選択中のWebViewが見つかりません。')
  }

  const saveCompletePage = window.electronWebviewPageSave?.saveCompletePage
  if (typeof saveCompletePage !== 'function') {
    throw new Error('保存APIが利用できません。main/preloadの登録を確認してください。')
  }

  const id = webview.getWebContentsId()
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error('WebViewのWebContents IDを取得できません。')
  }

  // ユーザーが保存先ダイアログを操作するため、短時間のタイムアウトは設定しない。
  const result = await saveCompletePage(id)
  if (result?.cancelled || result?.canceled) return result
  if (!result?.success) {
    throw new Error(result?.message || 'WebViewの保存に失敗しました。')
  }
  console.info('[SaveWebViewPageButton] 保存完了:', result.filePath)
  return result
}

function CompletePageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="3" width="20" height="17" rx="2" />
      <path d="M2 8h20M6 5.5h.01M9 5.5h.01M12 12h6M12 16h4M6 12h3v4H6z" />
    </svg>
  )
}

export default function SaveWebViewPageButton({
  className = '',
  iconOnly = false,
  disabled = false,
  getWebview,
  title = '選択中のWebViewをHTMLと関連ファイル一式で保存',
  children = 'HTML一式を保存',
  onSaved,
  onError,
}) {
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const handleClick = useCallback(async () => {
    if (saving || disabled) return
    setSaving(true)
    setMessage('')

    try {
      const result = await saveActiveWebviewCompletePage(getWebview)
      if (result?.cancelled || result?.canceled) return
      setMessage('HTMLと関連ファイルを保存しました。')
      onSaved?.(result)
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error)
      console.warn('[SaveWebViewPageButton] 保存失敗:', error)
      setMessage(detail)
      onError?.(error)
    } finally {
      setSaving(false)
    }
  }, [saving, disabled, getWebview, onSaved, onError])

  return (
    <span className={iconOnly ? "inline-flex items-center" : "inline-flex flex-col items-start gap-1"}>
      <button
        type="button"
        onClick={handleClick}
        disabled={saving || disabled}
        title={title}
        aria-label={iconOnly ? title : undefined}
        className={iconOnly
          ? `flex h-12 w-12 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-800 shadow-sm transition hover:bg-slate-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 ${className}`
          : `rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      >
        {iconOnly ? <CompletePageIcon /> : (saving ? '保存先を選択・保存中…' : children)}
      </button>
      {message && (
        <span role="status" aria-live="polite" className={iconOnly ? "sr-only" : "text-xs text-slate-600"}>
          {message}
        </span>
      )}
    </span>
  )
}
