import PassWordInput from '@/components/ui/PassWordInput'
import {
  useEffect,
  useState,
} from 'react'

import ToggleContainer from '@/components/ui/ToggleContainer'
import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { useDataBase } from '@/hooks/useDataBase'

import {
  saveConfig,
} from '@/utils/config/configUtils'

import {
  createConfigFormState,
  normalizeConfigData,
} from './parts'

function ConfigTab() {
  const [isSaving, setIsSaving] = useState(false)

  /*
   * ConfigTabで必要なのは主に
   * appState と updateAppState。
   *
   * databaseState / iniState / loadIni / saveIni / setIniState は
   * ini.jsonやDB設定用なので、このタブでは変更しない。
   */
  const {
    appState,
    databaseState,
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

  // Config.json の変更反映後にDBデータを再取得するために使用
  // autoLoad は使わず、保存後に明示的に実行する
  const { loadDataBase } = useDataBase()

  const [form, setForm] = useState(() => {
    return createConfigFormState(appState)
  })

  /*
   * 上記のContext値のうち、ConfigTabでは使用しない値。
   * 将来的に共通構造を維持するため取得だけ行う。
   */
  void databaseState
  void iniState
  void loadIni
  void saveIni
  void setIniState

  /*
   * config.jsonの値がRedux側で変更された場合、
   * フォームへ反映する。
   */
  useEffect(() => {
    setForm(
      createConfigFormState(appState)
    )
  }, [
    appState?.APP_LOCK_ENABLED,
    appState?.APP_LOCK_PASSCODE,
    appState?.HUG_USERNAME,
    appState?.HUG_PASSWORD,
    appState?.OPENAI_MAIL,
    appState?.OPENAI_PASSWORD,
    appState?.GEMINI_API_KEY,
    appState?.GEMINI_MODEL,
    appState?.DEEPSEEK_MAIL,
    appState?.DEEPSEEK_PASSWORD,
    appState?.OPEN_ROUTER_API_KEY,
    appState?.OPEN_ROUTER_MODEL,
    appState?.OLLAMA_URL,
    appState?.OLLAMA_MODEL,
  ])

  const handleInputChange = (event) => {
    const {
      name,
      value,
    } = event.target

    setForm((previous) => {
      return {
        ...previous,
        [name]: value,
      }
    })
  }

  /*
   * config.jsonへ保存
   */
  const handleSave = async () => {
    if (isSaving) {
      return
    }

    setIsSaving(true)

    try {
      const configData =
        normalizeConfigData(form)
      if (configData.APP_LOCK_ENABLED && !configData.APP_LOCK_PASSCODE) {
        throw new Error('ロックをONにする場合はパスコードを入力してください')
      }



      console.log(
        '[ConfigTab] Config.json保存内容:',
        configData
      )

      const result =
        await saveConfig(configData)

      if (
        result === false ||
        result == null ||
        result?.success === false
      ) {
        throw new Error(
          result?.error ||
          result?.message ||
          'config.jsonの保存処理が失敗しました'
        )
      }

      /*
       * 保存成功後にReduxへ反映する。
       */
      updateAppState(configData)

      /*
       * trimやデフォルト値補完後の値を
       * フォームにも反映する。
       */
      setForm(configData)

      /*
       * 保存内容を AppState に反映した後、
       * 現在選択中のDB/APIから全テーブルを再取得する。
       *
       * ConfigTabではDB種別自体は変更しないため、
       * forceDatabaseType は指定しない。
       * AUTO_SWITCHING は初回起動時のみ使用するため false。
       */
      console.log(
        '[ConfigTab] Config.json保存後のDBデータ再取得開始'
      )

      const reloadSuccess = await loadDataBase({
        reason: 'config-saved',
        useAutoSwitching: false,
      })

      if (!reloadSuccess) {
        console.warn(
          '[ConfigTab] Config.jsonは保存しましたが、DBデータの再取得に失敗しました'
        )

        showErrorToast(
          'Config.jsonは保存しましたが、データの再取得に失敗しました'
        )
      } else {
        console.log(
          '[ConfigTab] Config.json保存後のDBデータ再取得完了'
        )

        showSuccessToast(
          'Config.jsonを保存し、データを再読み込みしました'
        )
      }

      console.log(
        '[ConfigTab] Config.json保存完了:',
        configData
      )
    } catch (error) {
      console.error(
        '[ConfigTab] Config.json保存エラー:',
        error
      )

      showErrorToast(
        error?.message ||
        'Config.jsonの保存に失敗しました'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
        ID・パスワードの設定
      </h3>

      <div className="mb-2 rounded-lg border border-gray-500 bg-slate-50 p-2">
        <p className="font-bold">
          【 ログイン用データ 】
        </p>

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="config-username"
            className="min-w-[120px] font-medium text-gray-700"
          >
            HUGユーザー名:
          </label>

          <input
            type="text"
            id="config-username"
            name="HUG_USERNAME"
            value={form.HUG_USERNAME}
            onChange={handleInputChange}
            className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </div>

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="config-password"
            className="min-w-[120px] font-medium text-gray-700"
          >
            HUGパスワード:
          </label>

          <PassWordInput containerClassName="w-full max-w-[200px] flex-1"
              id="config-password"
              name="HUG_PASSWORD"
              value={form.HUG_PASSWORD}
              onChange={handleInputChange}
              className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
            />
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-gray-300 bg-slate-50 p-4">
        <p className="mb-3 font-bold">起動時のロック</p>
        <label className="mb-3 flex items-center gap-2">
          <input type="checkbox" checked={form.APP_LOCK_ENABLED}
            onChange={(event) => setForm((previous) => ({ ...previous, APP_LOCK_ENABLED: event.target.checked }))} />
          パスコードロックを有効にする
        </label>
        <label htmlFor="config-lock-passcode" className="mr-3">パスコード:</label>
        <PassWordInput id="config-lock-passcode" visibilityLabel="パスコード" name="APP_LOCK_PASSCODE"
          autoComplete="new-password" value={form.APP_LOCK_PASSCODE} onChange={handleInputChange}
          className="rounded border border-gray-300 px-3 py-2" />
        <p className="mt-2 text-sm text-gray-600">保存後、次回のアプリ起動から適用されます。</p>
      </div>
      <div className="mb-6">


        <div className="mb-2 flex flex-col gap-2 rounded-lg border border-gray-500 bg-slate-50 p-2">
          <p className="font-bold">
            【 AIの設定 】
          </p>

          <ToggleContainer buttonLabel="OpenAI">
            <div>
              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-openai-mail"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  OpenAIメールアドレス:
                </label>

                <input
                  type="text"
                  id="config-openai-mail"
                  name="OPENAI_MAIL"
                  value={form.OPENAI_MAIL}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-openai-password"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  OpenAIパスワード:
                </label>

                <PassWordInput containerClassName="w-full max-w-[200px] flex-1"
                    id="config-openai-password"
                    name="OPENAI_PASSWORD"
                    value={form.OPENAI_PASSWORD}
                    onChange={handleInputChange}
                    className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
              </div>
            </div>
          </ToggleContainer>

          <ToggleContainer buttonLabel="Gemini">
            <div>
              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-gemini"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  GEMINI API Key:
                </label>

                <input
                  type="text"
                  id="config-gemini"
                  name="GEMINI_API_KEY"
                  value={form.GEMINI_API_KEY}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-gemini-model"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  GEMINI Model:
                </label>

                <input
                  type="text"
                  id="config-gemini-model"
                  name="GEMINI_MODEL"
                  value={form.GEMINI_MODEL}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </ToggleContainer>

          <ToggleContainer buttonLabel="DeepSeek">
            <div>
              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-deepseek-mail"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  DeepSeekメールアドレス:
                </label>

                <input
                  type="text"
                  id="config-deepseek-mail"
                  name="DEEPSEEK_MAIL"
                  value={form.DEEPSEEK_MAIL}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-deepseek-password"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  DeepSeekパスワード:
                </label>

                <PassWordInput containerClassName="w-full max-w-[200px] flex-1"
                    id="config-deepseek-password"
                    name="DEEPSEEK_PASSWORD"
                    value={form.DEEPSEEK_PASSWORD}
                    onChange={handleInputChange}
                    className="w-full flex-1 rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  />
              </div>
            </div>
          </ToggleContainer>

          <ToggleContainer buttonLabel="OpenRouter">
            <div>
              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-openrouter-key"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  OpenRouter API Key:
                </label>

                <input
                  type="text"
                  id="config-openrouter-key"
                  name="OPEN_ROUTER_API_KEY"
                  value={form.OPEN_ROUTER_API_KEY}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-openrouter-model"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  OpenRouter Model:
                </label>

                <input
                  type="text"
                  id="config-openrouter-model"
                  name="OPEN_ROUTER_MODEL"
                  value={form.OPEN_ROUTER_MODEL}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </ToggleContainer>

          <ToggleContainer buttonLabel="Ollama">
            <div>
              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-ollama-url"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  Ollama URL:
                </label>

                <input
                  type="text"
                  id="config-ollama-url"
                  name="OLLAMA_URL"
                  value={form.OLLAMA_URL}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="mb-3 flex items-center py-2">
                <label
                  htmlFor="config-ollama-model"
                  className="min-w-[120px] font-medium text-gray-700"
                >
                  Ollama Model:
                </label>

                <input
                  type="text"
                  id="config-ollama-model"
                  name="OLLAMA_MODEL"
                  value={form.OLLAMA_MODEL}
                  onChange={handleInputChange}
                  className="max-w-[200px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>
            </div>
          </ToggleContainer>
        </div>
      </div>

      <div className="mb-6 flex gap-2.5">
        <button
          id="save-config"
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="cursor-pointer rounded-md border-none bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:from-blue-700 hover:to-blue-800 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? '保存中...'
            : 'ID・パスワードの変更を保存'}
        </button>
      </div>
    </div>
  )
}

export default ConfigTab
