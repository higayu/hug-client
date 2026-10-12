import {
  useEffect,
  useState,
} from 'react'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'

const clampInteger = (
  value,
  minimum,
  fallback
) => {
  const number =
    Number.parseInt(value, 10)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.max(number, minimum)
}

const createFormState = (iniState) => {
  const windowSettings =
    iniState?.appSettings?.window ?? {}

  return {
    width: clampInteger(
      windowSettings.width,
      800,
      1200
    ),

    height: clampInteger(
      windowSettings.height,
      600,
      800
    ),

    maximized:
      windowSettings.maximized === true,

    alwaysOnTop:
      windowSettings.alwaysOnTop === true,
  }
}

function WindowTab() {
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
    iniState?.appSettings?.window,
  ])

  const handleChange = (event) => {
    const {
      name,
      type,
      value,
      checked,
    } = event.target

    setForm((previous) => ({
      ...previous,

      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  const handleSave = async () => {
    if (isSaving || isReloading) {
      return
    }

    setIsSaving(true)

    try {
      const currentAppSettings =
        iniState?.appSettings ?? {}

      const currentWindowSettings =
        currentAppSettings.window ?? {}

      const nextWindowSettings = {
        ...currentWindowSettings,

        width: clampInteger(
          form.width,
          800,
          1200
        ),

        height: clampInteger(
          form.height,
          600,
          800
        ),

        maximized:
          form.maximized,

        alwaysOnTop:
          form.alwaysOnTop,
      }

      const nextIniState = {
        ...iniState,

        appSettings: {
          ...currentAppSettings,
          window: nextWindowSettings,
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
          'ウィンドウ設定の保存に失敗しました'
        )
      }

      setIniState(nextIniState)

      setForm(
        createFormState(nextIniState)
      )

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
        'ウィンドウ設定を保存しました'
      )
    } catch (error) {
      console.error(
        '[WindowTab] 保存エラー:',
        error
      )

      showErrorToast(
        error?.message ||
        'ウィンドウ設定の保存に失敗しました'
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
        'ウィンドウ設定を再読み込みしました'
      )
    } catch (error) {
      console.error(
        '[WindowTab] 再読み込みエラー:',
        error
      )

      showErrorToast(
        error?.message ||
        'ウィンドウ設定の再読み込みに失敗しました'
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
        ウィンドウ設定
      </h3>

      <div className="mb-6">
        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="window-width"
            className="min-w-[120px] font-medium text-gray-700"
          >
            幅:
          </label>

          <input
            type="number"
            id="window-width"
            name="width"
            value={form.width}
            onChange={handleChange}
            min="800"
            className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="window-height"
            className="min-w-[120px] font-medium text-gray-700"
          >
            高さ:
          </label>

          <input
            type="number"
            id="window-height"
            name="height"
            value={form.height}
            onChange={handleChange}
            min="600"
            className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <label className="mb-3 flex cursor-pointer items-center gap-2 py-2 font-medium text-gray-700">
          <input
            type="checkbox"
            id="window-maximized"
            name="maximized"
            checked={form.maximized}
            onChange={handleChange}
            className="h-[18px] w-[18px] accent-blue-600"
          />

          <span>最大化で起動</span>
        </label>

        <label className="mb-3 flex cursor-pointer items-center gap-2 py-2 font-medium text-gray-700">
          <input
            type="checkbox"
            id="window-always-on-top"
            name="alwaysOnTop"
            checked={form.alwaysOnTop}
            onChange={handleChange}
            className="h-[18px] w-[18px] accent-blue-600"
          />

          <span>常に最前面</span>
        </label>
      </div>

      <div className="mb-6 flex gap-2.5">
        <button
          type="button"
          onClick={handleReload}
          disabled={isProcessing}
          className="rounded-md bg-gray-600 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isReloading
            ? '再読み込み中...'
            : 'ウィンドウ設定を再読み込み'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? '保存中...'
            : 'ウィンドウ設定を保存'}
        </button>
      </div>
    </div>
  )
}

export default WindowTab