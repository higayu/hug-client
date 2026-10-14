import { useState } from 'react'

export default function OpenBrowserBtn({
  url,
  label,
  icon = null,
  openingLabel = '起動中…',
  className = '',
  iconClassName = 'h-5 w-5',
  disabled = false,
}) {
  const [opening, setOpening] = useState(false)
  const [error, setError] = useState('')

  const isDisabled =
    disabled || opening || !url

  async function openBrowser() {
    if (isDisabled) {
      return
    }

    setOpening(true)
    setError('')

    try {
      const openExternal =
        window.electronWindow?.openExternal

      if (
        typeof openExternal !== 'function'
      ) {
        throw new Error(
          '外部ブラウザを開く機能を利用できません。',
        )
      }

      const result =
        await openExternal(url)

      if (!result?.success) {
        throw new Error(
          result?.message ||
            `${label || 'リンク'}を開けませんでした。`,
        )
      }
    } catch (openError) {
      const errorMessage =
        openError instanceof Error
          ? openError.message
          : `${label || 'リンク'}を開けませんでした。`

      setError(errorMessage)
      console.error(
        errorMessage,
        openError,
      )
    } finally {
      setOpening(false)
    }
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={openBrowser}
        disabled={isDisabled}
        className={`
          flex items-center justify-center
          gap-2 rounded px-3 py-2
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${className}
        `}
      >
        {icon && (
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
        )}

        <span>
          {opening
            ? openingLabel
            : label}
        </span>
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