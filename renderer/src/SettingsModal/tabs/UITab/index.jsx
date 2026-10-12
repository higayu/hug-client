import {
  useEffect,
  useState,
} from 'react'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import CloseToggleSwitch from './CloseToggleSwitch'

const clamp = (
  value,
  minimum,
  maximum
) => {
  return Math.min(
    Math.max(value, minimum),
    maximum
  )
}

const intervalToSeconds = (value) => {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return 30
  }

  /*
   * 1000以上はミリ秒として扱う。
   * 30000 -> 30秒
   */
  if (numericValue >= 1000) {
    return clamp(
      Math.round(numericValue / 1000),
      10,
      300
    )
  }

  /*
   * 古い設定で秒数がそのまま保存されている場合にも対応。
   */
  return clamp(
    Math.round(numericValue),
    10,
    300
  )
}

const createFormState = (iniState) => {
  const ui =
    iniState?.appSettings?.ui ?? {}

  return {
    theme:
      ui.theme === 'dark'
        ? 'dark'
        : 'light',

    language:
      ui.language === 'en'
        ? 'en'
        : 'ja',

    showCloseButtons:
      ui.showCloseButtons !== false,

    autoRefreshEnabled:
      ui.autoRefresh?.enabled === true,

    refreshIntervalSeconds:
      intervalToSeconds(
        ui.autoRefresh?.interval
      ),

    confirmOnClose:
      ui.confirmOnClose !== false,
  }
}

const applyCloseButtonsVisibility = (visible) => {
  document.querySelectorAll('.close-btn').forEach((button) => {
    button.style.display = visible ? 'inline' : 'none'
  })
}

function UITab() {
  const [isSaving, setIsSaving] = useState(false)
  const [isReloading, setIsReloading] = useState(false)

  const {
    iniState,
    loadIni,
    saveIni,
    setIniState,
    updateAppState,
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
    iniState?.appSettings?.ui,
  ])

  const handleChange = (event) => {
    const {
      name,
      type,
      checked,
      value,
    } = event.target

    setForm((previous) => ({
      ...previous,

      [name]:
        type === 'checkbox'
          ? checked
          : value,
    }))
  }

  const handleShowCloseButtonsChange = (checked) => {
    setForm((previous) => ({
      ...previous,
      showCloseButtons: checked,
    }))
  }

  const handleSave = async () => {
    if (isSaving || isReloading) {
      return
    }

    setIsSaving(true)

    try {
      const refreshIntervalSeconds =
        clamp(
          Number.parseInt(
            form.refreshIntervalSeconds,
            10
          ) || 30,
          10,
          300
        )

      const currentAppSettings =
        iniState?.appSettings ?? {}

      const currentUi =
        currentAppSettings.ui ?? {}

      const nextUi = {
        ...currentUi,

        theme: form.theme,
        language: form.language,

        showCloseButtons:
          form.showCloseButtons,

        confirmOnClose:
          form.confirmOnClose,

        autoRefresh: {
          ...(currentUi.autoRefresh ?? {}),

          enabled:
            form.autoRefreshEnabled,

          /*
           * ini.jsonにはミリ秒で保存
           */
          interval:
            refreshIntervalSeconds * 1000,
        },
      }

      const nextIniState = {
        ...iniState,

        appSettings: {
          ...currentAppSettings,
          ui: nextUi,
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
          'UI設定の保存に失敗しました'
        )
      }

      setIniState(nextIniState)
      updateAppState({
        closeButtonsVisible: nextUi.showCloseButtons,
      })
      applyCloseButtonsVisibility(nextUi.showCloseButtons)

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
        'UI設定を保存しました'
      )
    } catch (error) {
      console.error(
        '[UITab] 保存エラー:',
        error
      )

      showErrorToast(
        error?.message ||
        'UI設定の保存に失敗しました'
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
        'UI設定を再読み込みしました'
      )
    } catch (error) {
      console.error(
        '[UITab] 再読み込みエラー:',
        error
      )

      showErrorToast(
        error?.message ||
        'UI設定の再読み込みに失敗しました'
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
        UI設定
      </h3>

      <div className="mb-6">
        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="theme-select"
            className="min-w-[120px] font-medium text-gray-700"
          >
            テーマ:
          </label>

          <select
            id="theme-select"
            name="theme"
            value={form.theme}
            onChange={handleChange}
            className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="light">
              ライト
            </option>

            <option value="dark">
              ダーク
            </option>
          </select>
        </div>

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="language-select"
            className="min-w-[120px] font-medium text-gray-700"
          >
            言語:
          </label>

          <select
            id="language-select"
            name="language"
            value={form.language}
            onChange={handleChange}
            className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="ja">
              日本語
            </option>

            <option value="en">
              English
            </option>
          </select>
        </div>

        <div className="mb-3 flex items-center gap-3 py-2 font-medium text-gray-700">
          <CloseToggleSwitch
            checked={form.showCloseButtons}
            onChange={handleShowCloseButtonsChange}
          />

          <label
            htmlFor="show-close-buttons"
            className="cursor-pointer"
          >
            閉じるボタンを表示
          </label>
        </div>

        <label className="mb-3 flex cursor-pointer items-center gap-2 py-2 font-medium text-gray-700">
          <input
            type="checkbox"
            id="auto-refresh"
            name="autoRefreshEnabled"
            checked={form.autoRefreshEnabled}
            onChange={handleChange}
            className="h-[18px] w-[18px] accent-blue-600"
          />

          <span>自動リフレッシュ</span>
        </label>

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="refresh-interval"
            className="min-w-[120px] font-medium text-gray-700"
          >
            リフレッシュ間隔（秒）:
          </label>

          <input
            type="number"
            id="refresh-interval"
            name="refreshIntervalSeconds"
            value={form.refreshIntervalSeconds}
            onChange={handleChange}
            min="10"
            max="300"
            disabled={!form.autoRefreshEnabled}
            className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
          />
        </div>

        <label className="mb-3 flex cursor-pointer items-center gap-2 py-2 font-medium text-gray-700">
          <input
            type="checkbox"
            id="confirm-on-close"
            name="confirmOnClose"
            checked={form.confirmOnClose}
            onChange={handleChange}
            className="h-[18px] w-[18px] accent-blue-600"
          />

          <span>
            ウィンドウを閉じる時、確認ダイアログを表示
          </span>
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
            : 'UI設定を再読み込み'}
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? '保存中...'
            : 'UI設定を保存'}
        </button>
      </div>
    </div>
  )
}

export default UITab
