import { useEffect, useState } from 'react'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'

const LARAVEL_URL_OPTIONS = [
  'https://dev-hug-banso.we-labo.com',
  'http://localhost:8000',
]

const createFormState = (apiSettings = {}) => ({
  baseURL: String(apiSettings.baseURL ?? ''),
  laravelURL: String(
    apiSettings.laravelURL ?? 'https://dev-hug-banso.we-labo.com'
  ),
})

function UrlTab() {
  const [isSaving, setIsSaving] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  const { iniState, loadIni, saveIni, setIniState } = useAppState()
  const { showSuccessToast, showErrorToast } = useToast()

  const [form, setForm] = useState(() =>
    createFormState(iniState?.apiSettings)
  )

  useEffect(() => {
    setForm(createFormState(iniState?.apiSettings))
  }, [
    iniState?.apiSettings?.baseURL,
    iniState?.apiSettings?.laravelURL,
  ])

  const handleInputChange = (event) => {
    const { name, value } = event.target

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSave = async () => {
    if (isSaving || isReloading) return

    setIsSaving(true)

    try {
      const nextIniState = {
        ...(iniState ?? {}),
        apiSettings: {
          ...(iniState?.apiSettings ?? {}),
          baseURL: form.baseURL.trim(),
          laravelURL: form.laravelURL.trim(),
        },
      }

      const result = await saveIni(nextIniState)

      if (
        result === false ||
        result == null ||
        result?.success === false
      ) {
        throw new Error(
          result?.error ||
            result?.message ||
            'URL設定の保存に失敗しました'
        )
      }

      setIniState(nextIniState)
      setForm(createFormState(nextIniState.apiSettings))

      showSuccessToast('URL設定を保存しました')
    } catch (error) {
      console.error('[UrlTab] URL設定保存エラー:', error)

      showErrorToast(
        error?.message || 'URL設定の保存に失敗しました'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReload = async () => {
    if (isSaving || isReloading) return

    setIsReloading(true)

    try {
      const loadedIni = await loadIni()

      if (!loadedIni) {
        throw new Error('ini.jsonを読み込めませんでした')
      }

      setIniState(loadedIni)
      setForm(createFormState(loadedIni.apiSettings))

      showSuccessToast('URL設定を再読み込みしました')
    } catch (error) {
      console.error('[UrlTab] URL設定再読み込みエラー:', error)

      showErrorToast(
        error?.message || 'URL設定の再読み込みに失敗しました'
      )
    } finally {
      setIsReloading(false)
    }
  }

  const isProcessing = isSaving || isReloading

  return (
    <div>
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
        URL設定 (ini.json)
      </h3>

      <div className="mb-6">
        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="api-base-url"
            className="min-w-[140px] font-medium text-gray-700"
          >
            APIベースURL:
          </label>

          <input
            type="url"
            id="api-base-url"
            name="baseURL"
            value={form.baseURL}
            onChange={handleInputChange}
            className="max-w-[500px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="api-laravel-url"
            className="min-w-[140px] font-medium text-gray-700"
          >
            Laravel URL:
          </label>

          <select
            id="api-laravel-url"
            name="laravelURL"
            value={form.laravelURL}
            onChange={handleInputChange}
            className="max-w-[500px] flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            {LARAVEL_URL_OPTIONS.map((url) => (
              <option key={url} value={url}>
                {url}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mb-6 flex gap-2.5">
        <button
          id="reload-url-settings"
          type="button"
          onClick={handleReload}
          disabled={isProcessing}
          className="rounded-md bg-gray-600 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isReloading
            ? '再読み込み中...'
            : 'URL設定を再読み込み'}
        </button>

        <button
          id="save-url-settings"
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? '保存中...' : 'URL設定を保存'}
        </button>
      </div>
    </div>
  )
}

export default UrlTab