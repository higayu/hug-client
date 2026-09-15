import { useEffect, useRef } from 'react'
// initTabs は React側の useTabs() フックに移行済み
import { loadAllReload } from '@/utils/config/reloadSettings.js'
// updateUI は React側の useUpdateUI() フックに移行済み
import { useUpdateUI } from './useUpdateUI.js'
// buttonVisibilityManager は削除されました（機能が空のため）
import { getActiveWebview } from '@/utils/webview/webviewState.js'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { confirmDialog } from '@/utils/dialog/confirmDialog.js'

function toBooleanFlag(value, defaultValue = true) {
  let result = defaultValue

  if (value === true || value === 'true') {
    result = true
  } else if (value === false || value === 'false') {
    result = false
  }

  return result
}

function normalizeDatabaseType(value) {
  if (typeof value === 'string') {
    return value.toLowerCase()
  }

  if (value && typeof value === 'object') {
    const dbType =
      value.type ||
      value.databaseType ||
      value.dbType ||
      value.DATABASE_TYPE ||
      'sqlite'

    return String(dbType).toLowerCase()
  }

  return 'sqlite'
}

async function getCurrentDatabaseType() {

  try {
    if (typeof window.electronAPI?.getDatabaseType === 'function') {
      const result = await window.electronAPI.getDatabaseType()
      const normalized = normalizeDatabaseType(result)

      return normalized
    }

    console.warn(
      '⚠️ [useAppInitialization] electronAPI.getDatabaseType がありません。IniState/AppState を参照します'
    )
  } catch (error) {
    console.warn(
      '⚠️ [useAppInitialization] electronAPI.getDatabaseType 取得エラー。IniState/AppState を参照します:',
      error
    )
  }

  const iniDatabaseType = window.IniState?.apiSettings?.databaseType

  if (iniDatabaseType !== undefined && iniDatabaseType !== null) {
    const normalized = normalizeDatabaseType(iniDatabaseType)

    return normalized
  }

  const appStateDatabaseType =
    window.AppState?.DATABASE_TYPE ||
    window.AppState?.databaseType ||
    window.AppState?.dbType

  if (appStateDatabaseType !== undefined && appStateDatabaseType !== null) {
    const normalized = normalizeDatabaseType(appStateDatabaseType)

    return normalized
  }

  console.warn(
    '⚠️ [useAppInitialization] DATABASE_TYPE を取得できないため sqlite 扱いにします'
  )

  return 'sqlite'
}

function logCloseSnapshot(label) {
  console.log(`🧭 [useAppInitialization] ${label}`, {
    IniStateExists: !!window.IniState,
    AppStateExists: !!window.AppState,

    // ============================================================
    // DATABASE_TYPE
    // ============================================================
    rawIniDatabaseType:
      window.IniState?.apiSettings?.databaseType,

    rawAppStateDatabaseType:
      window.AppState?.DATABASE_TYPE ||
      window.AppState?.databaseType ||
      window.AppState?.dbType,

    normalizedAppStateDatabaseType:
      normalizeDatabaseType(
        window.AppState?.DATABASE_TYPE ||
          window.AppState?.databaseType ||
          window.AppState?.dbType
      ),

    // ============================================================
    // AUTO_SYNCHRONIZATION
    // ============================================================
    rawIniAutoSynchronization:
      window.IniState?.apiSettings?.autoSynchronization,

    parsedIniAutoSynchronizationDefaultTrue:
      toBooleanFlag(
        window.IniState?.apiSettings?.autoSynchronization,
        true
      ),

    parsedIniAutoSynchronizationDefaultFalse:
      toBooleanFlag(
        window.IniState?.apiSettings?.autoSynchronization,
        false
      ),

    rawAppStateAutoSynchronization:
      window.AppState?.AUTO_SYNCHRONIZATION,

    parsedAppStateAutoSynchronization:
      toBooleanFlag(
        window.AppState?.AUTO_SYNCHRONIZATION,
        false
      ),

    // useWindowBridge では actions は window.AppState ではなく window 直下に出る
    hasWindowAutoSynchronizationFunction:
      typeof window.isAutoSynchronizationEnabled === 'function',

    windowAutoSynchronizationFunctionValue:
      typeof window.isAutoSynchronizationEnabled === 'function'
        ? window.isAutoSynchronizationEnabled()
        : undefined,

    parsedWindowAutoSynchronizationFunctionValue:
      typeof window.isAutoSynchronizationEnabled === 'function'
        ? toBooleanFlag(window.isAutoSynchronizationEnabled(), false)
        : undefined,

    // 古い参照方式。基本的には存在しない想定
    hasAppStateAutoSyncFunction:
      typeof window.AppState?.isAutoSynchronizationEnabled === 'function',

    appStateAutoSyncValue:
      typeof window.AppState?.isAutoSynchronizationEnabled === 'function'
        ? window.AppState.isAutoSynchronizationEnabled()
        : undefined,

    // ============================================================
    // AUTO_SWITCHING
    // ============================================================
    rawIniAutoSwitching:
      window.IniState?.apiSettings?.autoSwitching,

    parsedIniAutoSwitchingDefaultTrue:
      toBooleanFlag(
        window.IniState?.apiSettings?.autoSwitching,
        true
      ),

    parsedIniAutoSwitchingDefaultFalse:
      toBooleanFlag(
        window.IniState?.apiSettings?.autoSwitching,
        false
      ),

    rawAppStateAutoSwitching:
      window.AppState?.AUTO_SWITCHING,

    parsedAppStateAutoSwitching:
      toBooleanFlag(
        window.AppState?.AUTO_SWITCHING,
        false
      ),

    hasWindowAutoSwitchingFunction:
      typeof window.isAutoSwitchingEnabled === 'function',

    windowAutoSwitchingFunctionValue:
      typeof window.isAutoSwitchingEnabled === 'function'
        ? window.isAutoSwitchingEnabled()
        : undefined,

    // ============================================================
    // confirm / IPC
    // ============================================================
    rawConfirmOnClose:
      window.IniState?.appSettings?.ui?.confirmOnClose,

    parsedConfirmOnClose:
      toBooleanFlag(
        window.IniState?.appSettings?.ui?.confirmOnClose,
        true
      ),

    hasGetDatabaseType:
      typeof window.electronAPI?.getDatabaseType === 'function',

    hasSyncDatabaseStateToSqlite:
      typeof window.electronAPI?.syncDatabaseStateToSqlite === 'function',

    hasConfirmCloseRequest:
      typeof window.electronAPI?.onConfirmCloseRequest === 'function',

    hasSendConfirmCloseResponse:
      typeof window.electronAPI?.sendConfirmCloseResponse === 'function',
  })
}

function getAutoSynchronizationEnabled() {
  try {
    logCloseSnapshot('autoSynchronization 判定前 snapshot')

    // ============================================================
    // 1. Redux → window.AppState の値を最優先
    // useWindowBridge により window.AppState には Redux appState が入る
    // ============================================================
    const appStateValue = window.AppState?.AUTO_SYNCHRONIZATION

    if (appStateValue !== undefined && appStateValue !== null) {
      const result = toBooleanFlag(appStateValue, false)

      return result
    }

    // ============================================================
    // 2. window 直下の関数を見る
    // useWindowBridge は actions を window.AppState ではなく window 直下に出す
    // ============================================================
    if (typeof window.isAutoSynchronizationEnabled === 'function') {
      const fnResult = window.isAutoSynchronizationEnabled()
      const result = toBooleanFlag(fnResult, false)

      return result
    }

    // ============================================================
    // 3. 古い互換用: window.IniState
    // 現状 undefined になっているので優先度は下げる
    // ============================================================
    const iniValue = window.IniState?.apiSettings?.autoSynchronization

    if (iniValue !== undefined && iniValue !== null) {
      const result = toBooleanFlag(iniValue, false)

      console.log('✅ [useAppInitialization] autoSynchronization from window.IniState:', {
        raw: iniValue,
        rawType: typeof iniValue,
        result,
      })

      return result
    }

    // ============================================================
    // 4. どこからも取れない場合
    // 同期処理は危険側なので false 扱いにする
    // ============================================================
    console.warn(
      '⚠️ [useAppInitialization] autoSynchronization を取得できないため false 扱いにします'
    )

    return false
  } catch (error) {
    console.warn(
      '⚠️ [useAppInitialization] autoSynchronization 判定に失敗。安全側で false 扱いにします:',
      error
    )

    return false
  }
}

function getConfirmOnCloseEnabled() {
  const rawValue = window.IniState?.appSettings?.ui?.confirmOnClose
  const result = toBooleanFlag(rawValue, true)

  console.log('🔍 [useAppInitialization] confirmOnClose 判定:', {
    rawValue,
    rawValueType: typeof rawValue,
    result,
  })

  return result
}

function shouldSkipAutoSynchronization({ autoSynchronization, databaseType }) {
  const shouldSkip =
    !autoSynchronization || databaseType === 'sqlite' || databaseType !== 'mariadb'

  let reason = null

  if (!autoSynchronization) {
    reason = 'AUTO_SYNCHRONIZATION is false'
  } else if (databaseType === 'sqlite') {
    reason = 'DATABASE_TYPE is sqlite'
  } else if (databaseType !== 'mariadb') {
    reason = 'DATABASE_TYPE is not mariadb'
  }

  console.log('🔍 [useAppInitialization] 自動同期スキップ判定:', {
    autoSynchronization,
    databaseType,
    shouldSkip,
    reason,
    rawIniAutoSynchronization:
      window.IniState?.apiSettings?.autoSynchronization,
    rawIniDatabaseType:
      window.IniState?.apiSettings?.databaseType,
  })

  return {
    shouldSkip,
    reason,
  }
}

function getCloseConfirmMessage({ autoSynchronization, syncResult, databaseType }) {
  console.log('📝 [useAppInitialization] getCloseConfirmMessage START:', {
    autoSynchronization,
    databaseType,
    syncResult,
  })

  const skipCheck = shouldSkipAutoSynchronization({
    autoSynchronization,
    databaseType,
  })

  if (skipCheck.shouldSkip) {
    const message = 'アプリを終了しますか？'

    console.log('📝 [useAppInitialization] confirm message selected:', {
      reason: skipCheck.reason,
      message,
    })

    return message
  }

  if (syncResult?.success === false) {
    const message = [
      'MariaDBからSQLiteへの自動同期に失敗しました。',
      'このままアプリを終了しますか？',
    ].join('\n')

    console.log('📝 [useAppInitialization] confirm message selected:', {
      reason: 'sync failed',
      message,
    })

    return message
  }

  if (syncResult?.skipped) {
    const message = 'アプリを終了しますか？'

    console.log('📝 [useAppInitialization] confirm message selected:', {
      reason: syncResult?.reason || 'sync skipped',
      message,
    })

    return message
  }

  const message = [
    'MariaDBのデータをSQLiteに自動同期しました。',
    'アプリを終了しますか？',
  ].join('\n')

  console.log('📝 [useAppInitialization] confirm message selected:', {
    reason: 'sync success',
    message,
  })

  return message
}

async function runAutoSynchronizationBeforeConfirm(
  showErrorToastRef,
  autoSynchronization,
  databaseType
) {
  console.log('🚀 [useAppInitialization] runAutoSynchronizationBeforeConfirm START')

  console.log('🔍 [useAppInitialization] 同期前フラグ確認:', {
    autoSynchronization,
    databaseType,
    rawIniDatabaseType:
      window.IniState?.apiSettings?.databaseType,
    rawIniAutoSynchronization:
      window.IniState?.apiSettings?.autoSynchronization,
  })

  const skipCheck = shouldSkipAutoSynchronization({
    autoSynchronization,
    databaseType,
  })

  if (skipCheck.shouldSkip) {
    console.log(
      '⏭ [useAppInitialization] 終了時自動同期をスキップします',
      {
        reason: skipCheck.reason,
        autoSynchronization,
        databaseType,
      }
    )

    return {
      success: true,
      skipped: true,
      reason: skipCheck.reason,
      databaseType,
      autoSynchronization,
    }
  }

  if (typeof window.electronAPI?.syncDatabaseStateToSqlite !== 'function') {
    console.error(
      '❌ [useAppInitialization] syncDatabaseStateToSqlite が preload に公開されていません'
    )

    return {
      success: false,
      skipped: false,
      reason: 'syncDatabaseStateToSqlite is not exposed',
      databaseType,
      autoSynchronization,
    }
  }

  try {
    console.log(
      '🔄 [useAppInitialization] AUTO_SYNCHRONIZATION=true かつ DATABASE_TYPE=mariadb のため MariaDB → SQLite 自動同期を実行します'
    )

    console.time('⏱ [useAppInitialization] SQLite auto sync time')

    const result = await window.electronAPI.syncDatabaseStateToSqlite()

    console.timeEnd('⏱ [useAppInitialization] SQLite auto sync time')

    console.log('✅ [useAppInitialization] SQLite 自動同期 raw result:', result)

    const normalizedResult = {
      success: result?.success !== false,
      skipped: false,
      databaseType,
      autoSynchronization,
      result,
      error: result?.success === false ? result?.error : null,
    }

    console.log(
      '✅ [useAppInitialization] SQLite 自動同期 normalized result:',
      normalizedResult
    )

    return normalizedResult
  } catch (error) {
    console.timeEnd('⏱ [useAppInitialization] SQLite auto sync time')

    console.error('❌ [useAppInitialization] SQLite 自動同期エラー:', error)

    if (showErrorToastRef?.current) {
      showErrorToastRef.current(
        '自動同期に失敗しました。終了確認は続行します。'
      )
    }

    return {
      success: false,
      skipped: false,
      databaseType,
      autoSynchronization,
      error: error?.message || String(error),
    }
  } finally {
    console.log('🏁 [useAppInitialization] runAutoSynchronizationBeforeConfirm END')
  }
}

export function useAppInitialization() {
  const { showErrorToast } = useToast()
  const { addUpdateButtons } = useUpdateUI()
  const showErrorToastRef = useRef(showErrorToast)
  const initializedRef = useRef(false)

  // showErrorToastの参照を更新
  useEffect(() => {
    showErrorToastRef.current = showErrorToast
  }, [showErrorToast])

  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    let removeConfirmCloseListener = null

    const initializeApp = async () => {
      console.log('🚀 React App 初期化開始')

      // ===== 1️⃣ 設定読み込み =====
      console.log('🔄 [useAppInitialization] loadAllReload START')

      const ok = await loadAllReload()

      console.log('🔄 [useAppInitialization] loadAllReload DONE:', {
        ok,
        IniState: window.IniState,
        AppState: window.AppState,
      })

      logCloseSnapshot('loadAllReload 後 snapshot')

      if (!ok) {
        showErrorToastRef.current('❌ config.json の読み込みに失敗しました')
        return
      }

      // ===== 5️⃣ 設定エディター初期化 =====
      // 少し遅延させて確実に初期化
      setTimeout(async () => {
        console.log('🔄 設定エディターを初期化中...')

        // 設定が正しく読み込まれているか確認
        console.log('🔍 [MAIN] IniState確認:', window.IniState)
        console.log('🔍 [MAIN] AppState確認:', window.AppState)

        logCloseSnapshot('設定エディター初期化時 snapshot')

        // customButtons は専用 Context が ini.json から管理する

        // settingsEditorはReactコンポーネント（SettingsModal）に統合されました
        // window.settingsEditor = initSettingsEditor()
      }, 200)

      // ===== 6️⃣ ❌ ボタンの表示を更新（buttonVisibility.js は廃止） =====
      // setTimeout(() => {
      //   updateButtonVisibility()
      // }, 100)

      // ===== 退出確認（メインからの要求に応答） =====
      if (typeof window.electronAPI?.onConfirmCloseRequest === 'function') {
        removeConfirmCloseListener = window.electronAPI.onConfirmCloseRequest(
          async () => {
            console.log('🚪 [useAppInitialization] onConfirmCloseRequest RECEIVED')

            try {
              logCloseSnapshot('onConfirmCloseRequest 開始時 snapshot')

              const autoSynchronization = getAutoSynchronizationEnabled()
              const databaseType = await getCurrentDatabaseType()

              console.log(
                '🚪 [useAppInitialization] 終了確認前 条件判定:',
                {
                  autoSynchronization,
                  databaseType,
                  rawIniAutoSynchronization:
                    window.IniState?.apiSettings?.autoSynchronization,
                  rawIniDatabaseType:
                    window.IniState?.apiSettings?.databaseType,
                }
              )

              // window.confirm 実行前に以下の条件を確認する
              // - autoSynchronization=true
              // - DATABASE_TYPE=mariadb
              // 上記を満たす場合のみ MariaDB → SQLite 同期を実行する
              const syncResult = await runAutoSynchronizationBeforeConfirm(
                showErrorToastRef,
                autoSynchronization,
                databaseType
              )

              console.log(
                '🚪 [useAppInitialization] 終了確認前 syncResult:',
                syncResult
              )

              const confirmOnCloseEnabled = getConfirmOnCloseEnabled()

              console.log('🚪 [useAppInitialization] confirmOnCloseEnabled:', {
                confirmOnCloseEnabled,
                rawConfirmOnClose:
                  window.IniState?.appSettings?.ui?.confirmOnClose,
              })

              let shouldClose = true

              if (confirmOnCloseEnabled) {
                const confirmMessage = getCloseConfirmMessage({
                  autoSynchronization,
                  databaseType,
                  syncResult,
                })

                console.log(
                  '🚪 [useAppInitialization] 実際に window.confirm に渡す文字列:',
                  confirmMessage
                )

                shouldClose = await confirmDialog(confirmMessage)

                console.log('🚪 [useAppInitialization] window.confirm result:', {
                  shouldClose,
                })
              } else {
                console.log(
                  '🚪 [useAppInitialization] confirmOnClose=false のため window.confirm を表示せず終了します'
                )
              }

              console.log(
                '🚪 [useAppInitialization] sendConfirmCloseResponse:',
                {
                  shouldClose,
                }
              )

              window.electronAPI.sendConfirmCloseResponse(shouldClose)
            } catch (err) {
              console.error('❌ 終了確認処理エラー:', err)
              // 失敗時は安全側（閉じない）
              window.electronAPI.sendConfirmCloseResponse(false)
            }
          }
        )
      } else {
        console.error(
          '❌ [useAppInitialization] onConfirmCloseRequest が preload に公開されていません'
        )
      }

      console.log('🎉 初期化完了:', window.AppState)

      // 🔄 アップデートUI機能を初期化
      // updateUI は React側の useUpdateUI() フックに移行済み（自動初期化）
      const isDebugMode = window.electronAPI.isDebugMode()

      // デバッグモードの場合、追加のUIボタンを表示
      if (isDebugMode) {
        console.log('🔧 デバッグモード: 追加UIボタンを表示します')
        addUpdateButtons()
      }

      // ===== 🔟 ❌ ボタン表示制御マネージャー初期化（buttonVisibilityManager は削除） =====
      // buttonVisibilityManager は削除されました（機能が空のため）

      // ===== ⓫ アクティブURLのUI反映（設定モーダルのみ） =====
      function setModalUrlText(urlText) {
        const input = document.getElementById('current-webview-url')
        if (input) input.value = urlText || ''
      }

      function refreshUrlUI() {
        const vw = getActiveWebview()
        const url = vw && typeof vw.getURL === 'function' ? vw.getURL() : ''
        setModalUrlText(url)
      }

      // 初期反映
      refreshUrlUI()

      // アクティブwebview変更時に更新
      document.addEventListener('active-webview-changed', (e) => {
        const url = e?.detail?.url || ''
        setModalUrlText(url)
      })

      // webviewのナビゲーションイベントで更新
      function attachWebviewUrlListeners(vw) {
        if (!vw) return

        const handler = () => {
          const url = typeof vw.getURL === 'function' ? vw.getURL() : ''
          setModalUrlText(url)
        }

        vw.addEventListener('did-navigate', handler)
        vw.addEventListener('did-navigate-in-page', handler)
        vw.addEventListener('did-redirect-navigation', handler)
      }

      // 既存のhugviewにリスナー
      const hugview = document.getElementById('hugview')
      if (hugview) {
        attachWebviewUrlListeners(hugview)
      }

      // 追加されるwebviewにも自動でリスナーを付与
      const contentEl = document.getElementById('content')
      if (contentEl) {
        const mo = new MutationObserver((mutations) => {
          for (const m of mutations) {
            m.addedNodes.forEach((node) => {
              if (node && node.tagName === 'WEBVIEW') {
                attachWebviewUrlListeners(node)
              }
            })
          }
        })

        mo.observe(contentEl, { childList: true })
      }

      // 設定保存などによりIniStateが更新された場合の反映
      document.addEventListener('app-settings-updated', () => {
        console.log('🔄 [useAppInitialization] app-settings-updated received')
        logCloseSnapshot('app-settings-updated snapshot')
        refreshUrlUI()
      })
    }

    initializeApp()

    return () => {
      if (typeof removeConfirmCloseListener === 'function') {
        console.log(
          '🧹 [useAppInitialization] confirm close listener cleanup'
        )
        removeConfirmCloseListener()
      }
    }
  }, [])
}
