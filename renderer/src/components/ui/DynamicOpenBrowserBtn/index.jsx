
import { useRef, useState } from 'react'

export default function DynamicOpenBrowserBtn({
  resolveUrl,
  id,
  role,
  label,
  icon = null,
  resolvingLabel = '検索中…',
  openingLabel = '起動中…',
  className = '',
  iconClassName = 'h-5 w-5',
  disabled = false,
  onOpened = null,
  onError = null,
}) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')

  const busyRef = useRef(false)

  const isBusy = status !== 'idle'

  const isDisabled =
    disabled ||
    isBusy ||
    typeof resolveUrl !== 'function'

  // ========================================
  // 動的URL取得・外部ブラウザ起動
  // ========================================

  async function openBrowser() {
    if (isDisabled || busyRef.current) {
      return
    }

    busyRef.current = true

    setStatus('resolving')
    setError('')

    let openedUrl = null

    try {
      const openExternal =
        window.electronWindow?.openExternal

      if (typeof openExternal !== 'function') {
        throw new Error(
          '外部ブラウザを開く機能を利用できません。',
        )
      }

      // ====================================
      // 1. URLを動的に取得
      // ====================================

      const resolvedUrl = await resolveUrl()

      if (
        typeof resolvedUrl !== 'string' ||
        !resolvedUrl.trim()
      ) {
        throw new Error(
          '対象のURLを取得できませんでした。',
        )
      }

      // ====================================
      // 2. URLの検証
      // ====================================

      let targetUrl

      try {
        targetUrl = new URL(resolvedUrl)
      } catch {
        throw new Error(
          '取得したURLの形式が正しくありません。',
        )
      }

      if (
        !['https:', 'http:'].includes(
          targetUrl.protocol,
        )
      ) {
        throw new Error(
          '許可されていないURL形式です。',
        )
      }

      // ====================================
      // 3. 外部ブラウザを起動
      // ====================================

      setStatus('opening')

      const result = await openExternal(
        targetUrl.href,
      )

      if (!result?.success) {
        throw new Error(
          result?.message ||
            `${label || 'リンク'}を開けませんでした。`,
        )
      }

      openedUrl = targetUrl.href
    } catch (openError) {
      const errorMessage =
        openError instanceof Error
          ? openError.message
          : `${label || 'リンク'}を開けませんでした。`

      setError(errorMessage)

      console.error(
        '[DynamicOpenBrowserBtn]',
        errorMessage,
        openError,
      )

      if (typeof onError === 'function') {
        try {
          await onError(openError)
        } catch (callbackError) {
          console.error(callbackError)
        }
      }
    } finally {
      busyRef.current = false
      setStatus('idle')
    }

    // ====================================
    // 4. 起動成功後のコールバック
    // ====================================

    if (
      openedUrl &&
      typeof onOpened === 'function'
    ) {
      try {
        await onOpened(openedUrl)
      } catch (callbackError) {
        console.error(callbackError)
      }
    }
  }

  // ========================================
  // ボタンの表示ラベル
  // ========================================

  const displayLabel =
    status === 'resolving'
      ? resolvingLabel
      : status === 'opening'
        ? openingLabel
        : label

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        id={id}
        role={role}
        type="button"
        onClick={openBrowser}
        disabled={isDisabled}
        aria-busy={isBusy}
        className={`
          flex items-center justify-center
          gap-2 rounded px-3 py-2
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${className}
        `}
      >
        {isBusy ? (
          <span
            className={`
              flex shrink-0
              items-center justify-center
              ${iconClassName}
            `}
            aria-hidden="true"
          >
            <span
              className="
                h-4 w-4
                animate-spin
                rounded-full
                border-2
                border-current
                border-r-transparent
              "
            />
          </span>
        ) : (
          icon && (
            <span
              className={`
                flex shrink-0
                items-center justify-center
                ${iconClassName}
              `}
              aria-hidden="true"
            >
              {icon}
            </span>
          )
        )}

        <span>{displayLabel}</span>
      </button>

      {error && (
        <p
          className="
            max-w-xs
            text-xs text-red-600
          "
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  )
}
