import { useState } from 'react'
import { downloadActiveWebviewHtml } from './gethtml'

function HtmlFileIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M8 13l-2 2 2 2m8-4 2 2-2 2m-5-5-2 6" />
    </svg>
  )
}

export default function GetWebViewHtmlButton({
  disabled = false,
  getWebview,
  iconOnly = false,
  title = '選択中のWebViewのHTMLファイルを保存',
  className = '',
}) {
  const [saving, setSaving] = useState(false)

  const handleClick = async () => {
    if (saving || disabled) return
    setSaving(true)
    try {
      await downloadActiveWebviewHtml(getWebview)
    } finally {
      setSaving(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || saving}
      title={title}
      aria-label={iconOnly ? title : undefined}
      className={iconOnly
        ? `flex h-12 w-12 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${className}`
        : `w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400 ${className}`}
    >
      {iconOnly ? <HtmlFileIcon /> : (saving ? 'HTML取得中...' : 'HTMLを保存')}
    </button>
  )
}
