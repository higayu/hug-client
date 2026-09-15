import { useEffect, useMemo, useState, useCallback } from 'react'  // ← useCallback を追加
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { useDataBase } from '@/hooks/useDataBase'
import { selectLaravelAuth } from '@/store/slices/authSlice'

import {
  createFormState,
  isNotDeleted,
  normalizeDatabaseType,
  toId,
} from './parts'

function ApiTab() {
  const [isSaving, setIsSaving] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const auth = useSelector(selectLaravelAuth)

  const {
    appState,
    databaseState,
    iniState,
    saveIni,
    setIniState,
    updateAppState,
  } = useAppState()

  const {
    showSuccessToast,
    showErrorToast,
  } = useToast()

  // DB全テーブルを再取得するために使用
  // autoLoad は行わず、保存・初期化完了後に明示的に呼び出す
  const { loadDataBase } = useDataBase()

  const [form, setForm] = useState(() => {
    return createFormState({
      apiSettings: iniState?.apiSettings,
      appState,
      authUser: auth.user,
    })
  })

  /*
   * databaseState のテーブルを安全に配列として取得
   */
  const rawFacilities = useMemo(() => {
    return Array.isArray(databaseState?.facilitys)
      ? databaseState.facilitys
      : []
  }, [databaseState?.facilitys])

  const rawStaffs = useMemo(() => {
    return Array.isArray(databaseState?.staffs)
      ? databaseState.staffs
      : []
  }, [databaseState?.staffs])

  const rawFacilityStaff = useMemo(() => {
    return Array.isArray(databaseState?.facility_staff)
      ? databaseState.facility_staff
      : []
  }, [databaseState?.facility_staff])

  /*
   * 必要なテーブルがすべて読み込まれているか
   */
  const databaseReady =
    Array.isArray(databaseState?.facilitys) &&
    Array.isArray(databaseState?.staffs) &&
    Array.isArray(databaseState?.facility_staff)

  /*
   * 削除されていない施設一覧を生成
   */
  const facilityList = useMemo(() => {
    return rawFacilities
      .filter((facility) => {
        return (
          facility?.id != null &&
          facility?.name &&
          isNotDeleted(facility?.is_delete)
        )
      })
      .map((facility) => {
        return {
          id: toId(facility.id),
          name: String(facility.name),
          url: String(facility.url ?? ''),
        }
      })
  }, [rawFacilities])

  /*
   * スタッフごとの所属施設を生成
   */
  const allStaffList = useMemo(() => {
    const facilityIdsByStaffId = new Map()

    rawFacilityStaff.forEach((relation) => {
      const staffId = toId(relation?.staff_id)
      const facilityId = toId(relation?.facility_id)

      if (!staffId || !facilityId) {
        return
      }

      const currentFacilityIds =
        facilityIdsByStaffId.get(staffId) ?? []

      if (!currentFacilityIds.includes(facilityId)) {
        currentFacilityIds.push(facilityId)
      }

      facilityIdsByStaffId.set(
        staffId,
        currentFacilityIds
      )
    })

    return rawStaffs
      .filter((staff) => {
        return (
          staff?.id != null &&
          toId(staff.id) !== '-1' &&
          staff?.name &&
          isNotDeleted(staff?.is_delete)
        )
      })
      .map((staff) => {
        const staffId = toId(staff.id)

        return {
          id: staffId,
          name: String(staff.name),
          notes: String(staff.notes ?? ''),
          facilityIds:
            facilityIdsByStaffId.get(staffId) ?? [],
        }
      })
  }, [rawStaffs, rawFacilityStaff])

  /*
   * 選択中の施設に所属するスタッフだけ表示
   * 施設未選択の場合は全スタッフを表示
   */
  const filteredStaffList = useMemo(() => {
    const selectedFacilityId = toId(
      form.facilityId
    )

    if (!selectedFacilityId) {
      return allStaffList
    }

    return allStaffList.filter((staff) => {
      return staff.facilityIds.includes(
        selectedFacilityId
      )
    })
  }, [
    allStaffList,
    form.facilityId,
  ])

  /*
   * iniStateまたはappStateが外部で更新された場合、
   * フォームにも反映
   */
  useEffect(() => {
    setForm(
      createFormState({
        apiSettings: iniState?.apiSettings,
        appState,
        authUser: auth.user,
      })
    )
  }, [
    iniState?.apiSettings,
    appState?.BASE_URL,
    appState?.STAFF_ID,
    appState?.FACILITY_ID,
    appState?.DATABASE_TYPE,
    appState?.USE_AI,
    appState?.AUTO_SYNCHRONIZATION,
    appState?.AUTO_SWITCHING,
    appState?.DEBUG_FLG,  // ← 追加
    auth.user,
  ])

  /*
   * ini.jsonに保存された施設IDが施設一覧に存在しない場合、
   * 施設とスタッフの選択を解除
   */
  useEffect(() => {
    if (
      !databaseReady ||
      facilityList.length === 0 ||
      !form.facilityId
    ) {
      return
    }

    const facilityExists = facilityList.some(
      (facility) => {
        return facility.id === form.facilityId
      }
    )

    if (facilityExists) {
      return
    }

    console.warn(
      '[ApiTab] 設定中の施設IDが施設一覧にありません:',
      form.facilityId
    )

    setForm((previous) => {
      return {
        ...previous,
        facilityId: '',
      }
    })
  }, [
    databaseReady,
    facilityList,
    form.facilityId,
  ])

  /*
   * 通常のinput、select、checkbox変更
   */
  const handleInputChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target

    setForm((previous) => {
      return {
        ...previous,
        [name]:
          type === 'checkbox'
            ? checked
            : value,
      }
    })
  }

  /*
   * 施設変更時、現在のスタッフがその施設に所属していなければ解除
   */
  const handleFacilityChange = (event) => {
    const nextFacilityId = toId(
      event.target.value
    )

    setForm((previous) => ({
      ...previous,
      facilityId: nextFacilityId,
    }))
  }

  /*
  * debugFlg を個別に更新する関数
  */
  const handleDebugFlgChange = useCallback(async (newValue) => {
    // 現在の値をログ出力（デバッグ用）
    console.log('[ApiTab] handleDebugFlgChange called:', {
      currentFormValue: form.debugFlg,
      newValue,
      type: typeof newValue,
    })

    // フォームの状態を即時更新（UI反映用）
    setForm(prev => {
      const updated = { ...prev, debugFlg: newValue }
      console.log('[ApiTab] setForm updated:', updated)
      return updated
    })

    try {
      // ini.jsonの該当フィールドを個別更新
      const result = await window.electronAPI.updateIniSetting(
        'apiSettings.debugFlg',
        String(newValue)
      )

      console.log('[ApiTab] updateIniSetting result:', result)

      if (!result?.success) {
        console.error('[ApiTab] updateIniSetting failed:', result?.error)
        // 失敗したらフォームを元に戻す
        setForm(prev => ({ ...prev, debugFlg: !newValue }))
        showErrorToast(result?.error || 'デバッグフラグの更新に失敗しました')
        return
      }

      // ContextのiniStateを更新
      setIniState(prev => {
        const updated = {
          ...prev,
          apiSettings: {
            ...prev?.apiSettings,
            debugFlg: String(newValue)
          }
        }
        console.log('[ApiTab] setIniState updated:', updated)
        return updated
      })

      // Reduxを更新
      updateAppState({ DEBUG_FLG: newValue })

      showSuccessToast(`デバッグモードを${newValue ? '有効' : '無効'}にしました`)
    } catch (error) {
      console.error('[ApiTab] debugFlg更新エラー:', error)
      // エラー時はフォームを元に戻す
      setForm(prev => ({ ...prev, debugFlg: !newValue }))
      showErrorToast(error?.message || 'デバッグフラグの更新に失敗しました')
    }
  }, [form.debugFlg, setIniState, updateAppState, showSuccessToast, showErrorToast])

  /*
   * ini.jsonへ保存
   */
  const handleSave = async () => {
    if (isSaving || isResetting) {
      return
    }

    setIsSaving(true)

    try {
      const {
        staffId: _legacyStaffId,
        ...apiSettingsWithoutStaffId
      } = iniState?.apiSettings ?? {}

      const nextApiSettings = {
        ...apiSettingsWithoutStaffId,

        facilityId: toId(form.facilityId),

        databaseType: normalizeDatabaseType(
          form.databaseType
        ),

        useAI: form.useAI,

        autoAttendanceFetch: String(
          form.autoAttendanceFetch
        ),

        autoSynchronization: String(
          form.autoSynchronization
        ),

        autoSwitching: String(
          form.autoSwitching
        ),

        debugFlg: String(form.debugFlg),  // ← 追加
      }

      const nextIniState = {
        appSettings:
          iniState?.appSettings ?? {},

        userPreferences:
          iniState?.userPreferences ?? {},

        apiSettings:
          nextApiSettings,
      }

      console.log(
        '[ApiTab] ini.json保存内容:',
        nextIniState
      )

      const result = await saveIni(
        nextIniState
      )

      if (
        result === false ||
        result == null ||
        result?.success === false
      ) {
        throw new Error(
          result?.error ||
          result?.message ||
          'ini.jsonの保存処理が失敗しました'
        )
      }

      /*
       * ContextのiniStateへ反映
       */
      setIniState(nextIniState)

      /*
       * appStateSliceへ即時反映
       */
      updateAppState({
        FACILITY_ID:
          nextApiSettings.facilityId,

        DATABASE_TYPE:
          nextApiSettings.databaseType,

        USE_AI:
          nextApiSettings.useAI,

        AUTO_SYNCHRONIZATION:
          form.autoSynchronization,

        AUTO_SWITCHING:
          form.autoSwitching,

        DEBUG_FLG: form.debugFlg,  // ← 追加
      })

      /*
       * 保存内容を反映した状態でDBデータを再取得
       *
       * updateAppState直後は、このコンポーネントが保持している
       * databaseType がまだ旧値の場合があるため、保存した値を
       * forceDatabaseType で明示的に指定する。
       *
       * AUTO_SWITCHING は初回起動時だけ使うため、ここでは false。
       */
      console.log(
        '[ApiTab] 保存後のDBデータ再取得開始:',
        nextApiSettings.databaseType
      )

      const reloadSuccess = await loadDataBase({
        reason: 'api-settings-saved',
        forceDatabaseType:
          nextApiSettings.databaseType,
        useAutoSwitching: false,
      })

      if (!reloadSuccess) {
        console.warn(
          '[ApiTab] API設定は保存しましたが、DBデータの再取得に失敗しました'
        )

        showErrorToast(
          'API設定は保存しましたが、データの再取得に失敗しました'
        )
      } else {
        console.log(
          '[ApiTab] 保存後のDBデータ再取得完了'
        )

        showSuccessToast(
          'API設定を保存し、データを再読み込みしました'
        )
      }

      console.log(
        '[ApiTab] API設定保存完了:',
        nextApiSettings
      )
    } catch (error) {
      console.error(
        '[ApiTab] API設定保存エラー:',
        error
      )

      showErrorToast(
        error?.message ||
        'API設定の保存に失敗しました'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = async () => {
    if (isSaving || isResetting) return

    if (!window.confirm('ini.jsonの設定をすべて初期値に戻しますか？')) {
      return
    }

    setIsResetting(true)

    try {
      const result = await window.electronAPI.resetIni()
      if (!result?.success || !result?.data) {
        throw new Error(result?.error || 'ini.jsonの初期化に失敗しました')
      }

      const resetIniState = {
        appSettings: result.data.appSettings ?? {},
        userPreferences: result.data.userPreferences ?? {},
        apiSettings: result.data.apiSettings ?? {},
      }
      const nextForm = createFormState({
        apiSettings: resetIniState.apiSettings,
        appState,
        authUser: auth.user,
      })

      setIniState(resetIniState)
      setForm(nextForm)
      updateAppState({
        FACILITY_ID: nextForm.facilityId,
        DATABASE_TYPE: nextForm.databaseType,
        USE_AI: nextForm.useAI,
        AUTO_SYNCHRONIZATION: nextForm.autoSynchronization,
        AUTO_SWITCHING: nextForm.autoSwitching,
        DEBUG_FLG: nextForm.debugFlg,
      })

      const reloadSuccess = await loadDataBase({
        reason: 'api-settings-reset',
        forceDatabaseType: nextForm.databaseType,
        useAutoSwitching: false,
      })

      if (!reloadSuccess) {
        showErrorToast('ini.jsonは初期化しましたが、データの再取得に失敗しました')
      } else {
        showSuccessToast('ini.jsonを初期値に戻しました')
      }
    } catch (error) {
      console.error('[ApiTab] ini.json初期化エラー:', error)
      showErrorToast(error?.message || 'ini.jsonの初期化に失敗しました')
    } finally {
      setIsResetting(false)
    }
  }

  const isProcessing =
    isSaving || isResetting

  return (
    <div>
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
        API設定 (ini.json)
      </h3>

      {!databaseReady && (
        <div className="mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          施設・スタッフデータを読み込んでいます。
        </div>
      )}

      {databaseReady &&
        facilityList.length === 0 && (
          <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
            有効な施設データがありません。
          </div>
        )}

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="api-staff-id"
            className="min-w-[120px] font-medium text-gray-700"
          >
            スタッフ:
          </label>

          <div
            id="api-staff-id"
            className="max-w-[300px] flex-1 rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-sm text-gray-800"
          >
            {form.staffId
              ? `${form.staffName || '名称未取得'} (ID: ${form.staffId})`
              : '認証情報を取得できていません'}
          </div>

        </div>

      <div className="mb-6">
        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="api-facility-id"
            className="min-w-[120px] font-medium text-gray-700"
          >
            施設:
          </label>

          <select
            id="api-facility-id"
            name="facilityId"
            value={form.facilityId}
            onChange={handleFacilityChange}
            disabled={!databaseReady}
            className="max-w-[300px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            <option value="">
              選択してください
            </option>

            {facilityList.map((facility) => (
              <option
                key={facility.id}
                value={facility.id}
              >
                {facility.name}
              </option>
            ))}
          </select>
        </div>



        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="api-database-type"
            className="min-w-[120px] font-medium text-gray-700"
          >
            データベースタイプ:
          </label>

          <select
            id="api-database-type"
            name="databaseType"
            value={form.databaseType}
            onChange={handleInputChange}
            className="max-w-[300px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all"
          >
            <option value="sqlite">
              SQLite
            </option>

            <option value="mariadb">
              MariaDB
            </option>

            <option value="laravel">
              Laravel
            </option>
          </select>
        </div>

        <div className="mb-3 flex items-center py-2">
          <label
            htmlFor="api-ai-type"
            className="min-w-[120px] font-medium text-gray-700"
          >
            AI種別:
          </label>

          <select
            id="api-ai-type"
            name="useAI"
            value={form.useAI}
            onChange={handleInputChange}
            className="max-w-[300px] flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm transition-all"
          >
            <option value="chatGPT">
              ChatGPT
            </option>

            <option value="LaravelApi">
              Laravel-Api
            </option>

            <option value="gemini">
              Gemini
            </option>

            <option value="ollama">
              Ollama
            </option>

            <option value="deepseek">
              DeepSeek
            </option>

            <option value="openrouter">
              OpenRouter
            </option>
          </select>
        </div>

        <div className="mb-3 flex items-center py-2">
          <span className="min-w-[120px] font-medium text-gray-700">
            利用者自動取得:
          </span>

          <label
            htmlFor="api-auto-attendance-fetch"
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              id="api-auto-attendance-fetch"
              name="autoAttendanceFetch"
              type="checkbox"
              checked={form.autoAttendanceFetch}
              onChange={handleInputChange}
              className="h-4 w-4"
            />
            <span>有効にする</span>
          </label>
        </div>

        {form.debugFlg && (
        <>
          <div className="mb-3 flex items-center py-2">
          <span className="min-w-[120px] font-medium text-gray-700">
            自動同期:
          </span>

          <label
            htmlFor="api-auto-synchronization"
            className="flex items-center gap-2 text-sm text-gray-700"
          >
            <input
              type="checkbox"
              id="api-auto-synchronization"
              name="autoSynchronization"
              checked={form.autoSynchronization}
              onChange={handleInputChange}
              className="h-4 w-4"
            />

            <span>有効にする</span>

            <span>
              ※閉じる前に同期処理を実行します
            </span>
          </label>
        </div>


          <div className="mb-3 flex items-center py-2">
            <span className="min-w-[120px] font-medium text-gray-700">
              自動切替:
            </span>

            <label
              htmlFor="api-auto-switching"
              className="flex items-center gap-2 text-sm text-gray-700"
            >
              <input
                type="checkbox"
                id="api-auto-switching"
                name="autoSwitching"
                checked={form.autoSwitching}
                onChange={handleInputChange}
                className="h-4 w-4"
              />

              <span>有効にする</span>

              <span>
                ※吉島サーバに接続できる場合に自動で切り替わります
              </span>
            </label>
          </div>
        </>
        )}

        {/* ============================================================
            🐞 debugFlg 設定（新規追加）
            ============================================================ */}
        <div className="mb-3 border-t border-gray-200 pt-4">
          <div className="flex items-center py-2">
            <span className="min-w-[120px] font-medium text-gray-700">
              🐞 デバッグモード:
            </span>

            <div className="flex flex-1 items-center gap-4">
              <button
                type="button"
                onClick={() => handleDebugFlgChange(!form.debugFlg)}
                className={`
                  relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full 
                  border-2 border-transparent transition-colors duration-200 ease-in-out 
                  focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
                  ${form.debugFlg ? 'bg-blue-600' : 'bg-gray-200'}
                `}
                role="switch"
                aria-checked={form.debugFlg}
              >
                <span
                  className={`
                    pointer-events-none inline-block h-5 w-5 transform rounded-full 
                    bg-white shadow ring-0 transition duration-200 ease-in-out
                    ${form.debugFlg ? 'translate-x-5' : 'translate-x-0'}
                  `}
                />
              </button>

              <span className={`text-sm font-medium ${form.debugFlg ? 'text-green-600' : 'text-gray-500'}`}>
                {form.debugFlg ? '🟢 有効' : '⚪ 無効'}
              </span>

              <span className="text-xs text-gray-500">
                ※デバッグモード有効時は開発者向け機能が表示されます
              </span>
            </div>
          </div>

          {/* デバッグモード有効時の説明 */}
          {form.debugFlg && (
            <div className="ml-[120px] mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
              <p className="text-sm font-medium text-yellow-800">
                ⚠️ デバッグモードが有効です
              </p>
              <ul className="mt-1 text-xs text-yellow-700 list-disc list-inside space-y-0.5">
                <li>開発者ツール（DevTools）が利用可能になります</li>
                <li>詳細なデバッグログがコンソールに出力されます</li>
                <li>アプリケーションの動作確認用の追加機能が表示されます</li>
              </ul>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 flex gap-2.5">
        <button
          id="reset-api-settings"
          type="button"
          onClick={handleReset}
          disabled={isProcessing}
          className="rounded-md bg-red-600 px-5 py-2.5 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isResetting
            ? '初期化中...'
            : 'ini.jsonを初期値に戻す'}
        </button>

        <button
          id="save-api-settings"
          type="button"
          onClick={handleSave}
          disabled={isProcessing}
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving
            ? '保存中...'
            : 'API設定を保存'}
        </button>
      </div>
    </div>
  )
}

export default ApiTab
