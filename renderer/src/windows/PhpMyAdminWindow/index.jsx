import { useEffect, useRef, useState } from 'react'

import AuthDialog from './AuthDialog'
import SideBar from './SideBar'

export default function PhpMyAdminWindow() {
  const webviewRef = useRef(null)
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [authRequest, setAuthRequest] = useState(null)

  useEffect(() => {
    const removeListener = window.electronAPI?.onPhpMyAdminAuthRequest?.(
      (details) => setAuthRequest(details || {}),
    )

    return () => removeListener?.()
  }, [])

  useEffect(() => {
    let active = true

    window.electronAPI
      ?.readConfig?.()
      .then((result) => {
        if (!active) return
        if (result?.success === false) {
          throw new Error(result.error || 'config.jsonを読み込めませんでした。')
        }
        setConfig(result?.data ?? result)
      })
      .catch((loadError) => {
        if (active) setError(loadError?.message || String(loadError))
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    const webview = webviewRef.current
    if (!webview || !config) return undefined

    const handleLoad = () => setLoading(false)
    const handleFailure = (event) => {
      if (event.errorCode === -3) return
      setLoading(false)
      setError(`ページを読み込めませんでした: ${event.errorDescription}`)
    }
    webview.addEventListener('did-finish-load', handleLoad)
    webview.addEventListener('did-fail-load', handleFailure)

    return () => {
      webview.removeEventListener('did-finish-load', handleLoad)
      webview.removeEventListener('did-fail-load', handleFailure)
    }
  }, [config])

  const handleLogin = async (credentials) => {
    setError('')
    const result = await window.electronAPI?.respondToPhpMyAdminAuth?.(
      credentials,
    )
    if (!result || result.success === false) {
      throw new Error(result?.error || '認証情報を送信できませんでした。')
    }
    setAuthRequest(null)
  }

  const handleCancelLogin = async () => {
    await window.electronAPI?.respondToPhpMyAdminAuth?.({ cancelled: true })
    setAuthRequest(null)
    setLoading(false)
  }

  const url = String(config?.PHP_MY_ADMIN ?? '').trim()
  const validUrl = /^https?:\/\//i.test(url) && url !== 'https'

  if (!loading && !validUrl) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="max-w-xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900 shadow-sm">
          <h1 className="text-lg font-bold">phpMyAdminのURLが未設定です</h1>
          <p className="mt-2 text-sm">
            config.json の PHP_MY_ADMIN に https:// から始まるURLを設定してください。
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col bg-slate-900">
      <header className="flex items-center justify-between gap-4 bg-slate-800 px-4 py-2 text-white">
        <div className="min-w-0">
          <h1 className="font-bold">phpMyAdmin</h1>
          <p className="truncate text-xs text-slate-300">{url}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setError('')
            setLoading(true)
            webviewRef.current?.reload()
          }}
          className="rounded bg-slate-600 px-3 py-1.5 text-sm hover:bg-slate-500"
        >
          再読み込み
        </button>
      </header>

      {error && (
        <div className="bg-red-100 px-4 py-2 text-sm text-red-800">{error}</div>
      )}

      <div className="flex min-h-0 flex-1">
        <SideBar config={config} />

        <div className="relative min-w-0 flex-1">
          {loading && !authRequest && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white text-sm text-slate-500">
              読み込んでいます...
            </div>
          )}
          {validUrl && (
            <webview
              ref={webviewRef}
              src={url}
              className="h-full w-full"
              partition="persist:php-my-admin"
            />
          )}
          {authRequest && (
            <AuthDialog
              host={authRequest.host || url}
              onCancel={handleCancelLogin}
              onLogin={handleLogin}
            />
          )}
        </div>
      </div>
    </div>
  )
}
