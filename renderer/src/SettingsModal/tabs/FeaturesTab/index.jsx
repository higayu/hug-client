import {
  useCallback,
  useEffect,
  useState,
} from 'react'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { getActiveWebview } from '@/utils/webview/webviewState.js'

const createFormState = (iniState) => {
  return {
    getUrlEnabled:
      iniState?.appSettings?.features?.getUrl?.enabled === true,
  }
}

function FeaturesTab() {
  const [currentUrl, setCurrentUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  const {
    iniState,
    loadIni,
    saveIni,
    setIniState,
  } = useAppState()

  const {
    showSuccessToast,
    showErrorToast,
  } = useToast()

  const [form, setForm] = useState(() => {
    return createFormState(iniState)
  })

  useEffect(() => {
    setForm(createFormState(iniState))
  }, [
    iniState?.appSettings?.features?.getUrl?.enabled,
  ])

  /*
   * WebViewのURLを取得
   */
  useEffect(() => {
    let cleanupWebviewListeners = null

    const readUrl = async (webview) => {
      if (!webview) {
        setCurrentUrl('')
        return
      }

      try {
        const maybeUrl = webview.getURL?.()

        const url =
          typeof maybeUrl === 'string'
            ? maybeUrl
            : await maybeUrl

        const fallbackUrl =
          webview.getAttribute?.('src') ?? ''

        setCurrentUrl(
          url ||
          fallbackUrl ||
          ''
        )
      } catch (error) {
        console.error(
          '[FeaturesTab] URL取得エラー:',
          error
        )

        setCurrentUrl('')
      }
    }

    const attachWebviewListeners = (webview) => {
      if (!webview) {
        return () => {}
      }

      const handleNavigate = () => {
        readUrl(webview)
      }

      webview.addEventListener(
        'did-navigate',
        handleNavigate
      )

      webview.addEventListener(
        'did-navigate-in-page',
        handleNavigate
      )

      webview.addEventListener(
        'did-finish-load',
        handleNavigate
      )

      webview.addEventListener(
        'dom-ready',
        handleNavigate
      )

      return () => {
        try {
          webview.removeEventListener(
            'did-navigate',
            handleNavigate
          )

          webview.removeEventListener(
            'did-navigate-in-page',
            handleNavigate
          )

          webview.removeEventListener(
            'did-finish-load',
            handleNavigate
          )

          webview.removeEventListener(
            'dom-ready',
            handleNavigate
          )
        } catch (error) {
          console.warn(
            '[FeaturesTab] WebViewイベント解除エラー:',
            error
          )
        }
      }
    }

    const initialWebview =
      getActiveWebview()

    readUrl(initialWebview)

    cleanupWebviewListeners =
      attachWebviewListeners(initialWebview)

    const handleActiveWebviewChanged = (event) => {
      const nextWebview =
        event?.detail?.webview ||
        getActiveWebview()

      cleanupWebviewListeners?.()

      readUrl(nextWebview)

      cleanupWebviewListeners =
        attachWebviewListeners(nextWebview)
    }

    document.addEventListener(
      'active-webview-changed',
      handleActiveWebviewChanged
    )

    return () => {
      document.removeEventListener(
        'active-webview-changed',
        handleActiveWebviewChanged
      )

      cleanupWebviewListeners?.()
    }
  }, [])

  const handleCopy = async () => {
    if (!currentUrl) {
      return
    }

    try {
      await navigator.clipboard.writeText(
        currentUrl
      )

      showSuccessToast(
        'URLをクリップボードにコピーしました'
      )
    } catch (error) {
      console.error(
        '[FeaturesTab] URLコピーエラー:',
        error
      )

      try {
        const input =
          document.getElementById(
            'current-webview-url'
          )

        input?.select()

        const success =
          document.execCommand('copy')

        if (!success) {
          throw new Error(
            'クリップボードへのコピーに失敗しました'
          )
        }

        showSuccessToast(
          'URLをクリップボードにコピーしました'
        )
      } catch (fallbackError) {
        showErrorToast(
          fallbackError?.message ||
          'URLのコピーに失敗しました'
        )
      }
    }
  }

  const handleSave = async () => {
    if (isSaving || isReloading) {
      return
    }

    setIsSaving(true)

    try {
      const currentAppSettings =
        iniState?.appSettings ?? {}

      const currentFeatures =
        currentAppSettings.features ?? {}

      const currentGetUrl =
        currentFeatures.getUrl ?? {}

      const nextIniState = {
        ...iniState,

        appSettings: {
          ...currentAppSettings,

          features: {
            ...currentFeatures,

            getUrl: {
              ...currentGetUrl,
              enabled: form.getUrlEnabled,
            },
          },
        },

        userPreferences:
          iniState?.userPreferences ?? {},

        apiSettings:
          iniState?.apiSettings ?? {},
      }

      const result =
        await saveIni(nextIniState)

      if (
        result === false ||
        result == null ||
        result?.success === false
      ) {
        throw new Error(
          result?.error ||
          result?.message ||
          '機能設定の保存に失敗しました'
        )
      }

      setIniState(nextIniState)

      document.dispatchEvent(
        new CustomEvent(
          'app-settings-updated',
          {
            detail: {
              IniState: nextIniState,
              appSettings:
                nextIniState.appSettings,
            },
          }
        )
      )

      showSuccessToast(
        '機能設定を保存しました'
      )
    } catch (error) {
      console.error(
        '[FeaturesTab] 保存エラー:',
        error
      )

      showErrorToast(
        error?.message ||
        '機能設定の保存に失敗しました'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReload = async () => {
    if (isSaving || isReloading) {
      return
    }

    setIsReloading(true)

    try {
      const loadedIni =
        await loadIni()

      if (!loadedIni) {
        throw new Error(
          'ini.jsonを読み込めませんでした'
        )
      }

      setForm(
        createFormState(loadedIni)
      )

      showSuccessToast(
        '機能設定を再読み込みしました'
      )
    } catch (error) {
      console.error(
        '[FeaturesTab] 再読み込みエラー:',
        error
      )

      showErrorToast(
        error?.message ||
        '機能設定の再読み込みに失敗しました'
      )
    } finally {
      setIsReloading(false)
    }
  }

  const isProcessing =
    isSaving || isReloading

  return (
    <div>
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
        機能の有効/無効
      </h3>

      <div className="mb-6">
        <label className="mb-3 flex cursor-pointer items-center gap-2 py-2 font-medium text-gray-700">
          <input
            type="checkbox"
            id="feature-getUrl"
            checked={form.getUrlEnabled}
            onChange={(event) => {
              setForm((previous) => ({
                ...previous,
                getUrlEnabled:
                  event.target.checked,
              }))
            }}
            className="h-[18px] w-[18px] accent-blue-600"
          />

          <span>URL取得</span>
        </label>
      </div>

      {form.getUrlEnabled && (
        <>
          <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
            現在のURL
          </h3>

          <div
            id="current-url-container"
            className="mb-6"
          >
            <div className="mb-3 flex w-full items-center py-2">
              <label
                htmlFor="current-webview-url"
                className="min-w-[120px] font-medium text-gray-700"
              >
                アクティブWebViewのURL:
              </label>

              <input
                type="text"
                id="current-webview-url"
                readOnly
                value={currentUrl}
                placeholder="URLを取得中..."
                className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
              />

              <button
                type="button"
                onClick={handleCopy}
                disabled={!currentUrl}
                className="ml-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                コピー
              </button>
            </div>
          </div>
        </>
      )}

      <div className="mb-6 flex gap-2.5">
        <button
          type="button"
          onClick={handleReload}
          disabled={isProcessing}
          className="rounded-md bg-gray-600 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isReloading
            ? '再読み込み中...'
            : '機能設定を再読み込み'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? '保存中...'
            : '機能設定を保存'}
        </button>
      </div>
    </div>
  )
}

export default FeaturesTab