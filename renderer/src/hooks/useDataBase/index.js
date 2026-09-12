// renderer/src/hooks/useDataBase/index.js

import { useEffect, useCallback, useRef } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useAppState } from "@/AppStateContext"

import { mariadbApi } from "./sql/mariadbApi"
import { sqliteApi } from "./sql/sqliteApi"
import { laravelApi } from "./sql/laravelApi"

import { fetchAllTables } from "@/store/slices/databaseSlice"
import { fetchLaravelAuthState } from "@/store/slices/authSlice"
import { selectDatabaseType } from "@/store/slices/appStateSlice"
import { checkMariaDbConnection } from "./checkMariaDbConnection"
import { checkLaravelConnection } from "./checkLaravelConnection"

function toBooleanFlag(value, defaultValue = true) {
  if (value === true || value === "true") return true
  if (value === false || value === "false") return false
  return defaultValue
}

/**
 * AUTO_SWITCHING を取得する
 *
 * 重要:
 * この関数は loadDataBase({ useAutoSwitching: true }) の時だけ使う。
 * つまり、初回自動取得の時だけ AUTO_SWITCHING を参照する。
 */
function getAutoSwitchingEnabledForUseDataBase() {
  if (window.AppState?.AUTO_SWITCHING !== undefined) {
    return toBooleanFlag(window.AppState.AUTO_SWITCHING, true)
  }

  if (typeof window.isAutoSwitchingEnabled === "function") {
    return toBooleanFlag(window.isAutoSwitchingEnabled(), true)
  }

  try {
    if (typeof window.getApiSettings === "function") {
      const apiSettings = window.getApiSettings()
      const autoSwitching = apiSettings?.autoSwitching

      if (autoSwitching !== undefined && autoSwitching !== null) {
        return toBooleanFlag(autoSwitching, true)
      }
    }
  } catch (error) {
    console.warn("⚠️ [useDataBase] AUTO_SWITCHING 取得エラー:", error)
  }

  if (window.IniState?.apiSettings?.autoSwitching !== undefined) {
    return toBooleanFlag(
      window.IniState.apiSettings.autoSwitching,
      true
    )
  }

  return true
}

/**
 * DBデータ取得フック
 *
 * 役割:
 * - DBから全テーブルを取得する
 * - 取得した全テーブルを databaseSlice に保存する
 *
 * 重要:
 * - 子どもデータの抽出はここでは行わない
 * - childrenData / waiting_childrenData / Experience_childrenData への保存もしない
 * - 曜日変更時の再抽出は AppStateContext 側の getChildrenDataByDay() で行う
 */
export function useDataBase({ autoLoad = false } = {}) {
  const {
    isInitialized,
    resetChilledspace,
  } = useAppState()

  const dispatch = useDispatch()

  const databaseTypeFromRedux = useSelector(selectDatabaseType)
  const databaseType = databaseTypeFromRedux || "mariadb"

  // =============================================================
  // 取得制御用 ref
  // =============================================================
  const loadingRef = useRef(false)
  const loadSeqRef = useRef(0)
  const didAutoLoadRef = useRef(false)

  // =============================================================
  // DATABASE_TYPE から API を解決
  // =============================================================
  const resolveApiByDatabaseType = useCallback((type) => {
    const normalizedType = String(type ?? "")
      .trim()
      .toLowerCase()

    if (normalizedType === "laravel") {
      return laravelApi
    }

    if (normalizedType === "mariadb") {
      return mariadbApi
    }

    return sqliteApi
  }, [])

  // =============================================================
  // DB全テーブル取得
  //
  // options:
  // - reason: ログ用
  // - force: true の場合、取得中でも強制的に再取得する
  // - forceDatabaseType: DB種別を強制する
  // - useAutoSwitching:
  //   true の場合だけ AUTO_SWITCHING を参照し、接続先を自動選択する
  //   初回自動取得以外では基本 false
  // =============================================================
  const loadDataBase = useCallback(
    async (options = {}) => {
      const loadId = ++loadSeqRef.current
      const reason = options.reason || "manual/unknown"
      const force = options.force === true
      const forceDatabaseType = options.forceDatabaseType

      /**
       * 重要:
       * AUTO_SWITCHING を使うかどうかは呼び出し側で明示する。
       *
       * true:
       * - AUTO_SWITCHING=true なら Laravel → MariaDB の順に接続確認する
       *
       * false:
       * - 自動接続確認をせず、現在選択されているDB/APIを使う
       */
      const useAutoSwitching = options.useAutoSwitching === true

      console.group(`🧩 [useDataBase] loadDataBase START #${loadId}`)

      console.log("📌 [useDataBase] call info:", {
        loadId,
        reason,
        force,
        forceDatabaseType,
        useAutoSwitching,
        autoLoad,
        isInitialized,
        databaseType,
        reduxDatabaseType: databaseTypeFromRedux,
        appStateDatabaseType: window.AppState?.DATABASE_TYPE,
        appStateAutoSwitching: window.AppState?.AUTO_SWITCHING,
        iniDatabaseType: window.IniState?.apiSettings?.databaseType,
        iniAutoSwitching: window.IniState?.apiSettings?.autoSwitching,
      })

      // 通常読み込みの場合は二重取得を防止
      if (loadingRef.current && !force) {
        console.warn(
          "⏳ [useDataBase] すでにデータ取得中のためスキップします",
          {
            loadId,
            reason,
          }
        )

        console.groupEnd()
        return false
      }

      // reloadData 等から force=true で呼ばれた場合
      if (loadingRef.current && force) {
        console.warn(
          "🔄 [useDataBase] force=true のため強制再読み込みします",
          {
            loadId,
            reason,
          }
        )
      }

      loadingRef.current = true

      try {
        if (!isInitialized) {
          console.warn(
            "⏳ [useDataBase] 初期化前のため取得をスキップします",
            {
              loadId,
              reason,
              isInitialized,
            }
          )

          console.groupEnd()
          return false
        }

        let resolvedDatabaseType =
          forceDatabaseType || databaseType || "mariadb"

        let apiToUse = resolveApiByDatabaseType(
          resolvedDatabaseType
        )

        let mariaDbConnectionResult = null
        let checkedMariaDbConnection = false
        let laravelConnectionResult = null

        console.log(
          "🔍 [useDataBase] 初期 resolvedDatabaseType:",
          {
            loadId,
            reason,
            force,
            forceDatabaseType,
            useAutoSwitching,
            databaseType,
            resolvedDatabaseType,
            reduxDatabaseType: databaseTypeFromRedux,
            appStateDatabaseType:
              window.AppState?.DATABASE_TYPE,
            appStateAutoSwitching:
              window.AppState?.AUTO_SWITCHING,
            iniDatabaseType:
              window.IniState?.apiSettings?.databaseType,
            iniAutoSwitching:
              window.IniState?.apiSettings?.autoSwitching,
          }
        )

        // =============================================================
        // 初回自動取得時の接続優先順位
        // Laravel → MariaDB → SQLite
        // 接続できた時点で確認を終了し、そのDB/APIを使用する。
        // =============================================================
        const autoSwitchingEnabled = useAutoSwitching
          ? getAutoSwitchingEnabledForUseDataBase()
          : false

        if (autoSwitchingEnabled) {
          console.log(
            "🔌 [useDataBase] AUTO_SWITCHING=true: Laravel API接続確認を実行します"
          )

          laravelConnectionResult =
            await checkLaravelConnection(dispatch, {
              autoFallbackToSqlite: false,
              switchToLaravelOnSuccess: true,
              persistIni: true,
            })

          if (laravelConnectionResult?.connected === true) {
            console.log(
              "✅ [useDataBase] Laravel APIに接続できたため接続確認を終了します"
            )

            resolvedDatabaseType = "laravel"
            apiToUse = laravelApi
          } else {
            console.log(
              "⏭ [useDataBase] Laravel APIに接続できないため MariaDB接続確認を実行します"
            )

            mariaDbConnectionResult =
              await checkMariaDbConnection(dispatch, {
                autoFallbackToSqlite: true,
                switchToMariaDbOnSuccess: true,
                persistIni: true,
              })

            checkedMariaDbConnection = true

            if (
              mariaDbConnectionResult?.connected === true
            ) {
              console.log(
                "✅ [useDataBase] MariaDBに接続できたため接続確認を終了します"
              )

              resolvedDatabaseType = "mariadb"
              apiToUse = mariadbApi
            } else {
              console.log(
                "⏭ [useDataBase] Laravel/MariaDBに接続できないため SQLiteを使用します"
              )

              resolvedDatabaseType = "sqlite"
              apiToUse = sqliteApi
            }
          }
        }

        // =============================================================
        // DATABASE_TYPE=mariadb の場合
        //
        // ここは AUTO_SWITCHING とは別。
        // MariaDB が選択されているなら接続確認し、
        // 接続失敗時は SQLite fallback する。
        // =============================================================
        if (resolvedDatabaseType === "mariadb") {
          if (checkedMariaDbConnection) {
            console.log(
              "🔌 [useDataBase] すでに MariaDB接続確認済みのため再チェックを省略します",
              {
                connected:
                  mariaDbConnectionResult?.connected,

                switchedDatabaseType:
                  mariaDbConnectionResult
                    ?.switchedDatabaseType,

                fallbackToSqlite:
                  mariaDbConnectionResult
                    ?.fallbackToSqlite,

                currentDatabaseType:
                  mariaDbConnectionResult
                    ?.currentDatabaseType,
              }
            )

            if (
              mariaDbConnectionResult?.connected === true
            ) {
              apiToUse = mariadbApi
            } else {
              console.warn(
                "⚠️ [useDataBase] 接続確認済みだが connected=false のため sqliteApi を使用します"
              )

              resolvedDatabaseType = "sqlite"
              apiToUse = sqliteApi
            }
          } else {
            console.log(
              "🔌 [useDataBase] DATABASE_TYPE=mariadb のため MariaDB接続確認を実行します"
            )

            mariaDbConnectionResult =
              await checkMariaDbConnection(dispatch, {
                autoFallbackToSqlite: true,
                switchToMariaDbOnSuccess: false,
                persistIni: true,
              })

            checkedMariaDbConnection = true

            console.log(
              "🔌 [useDataBase] mariadb時の MariaDB接続確認結果:",
              mariaDbConnectionResult
            )

            if (
              mariaDbConnectionResult?.connected === true
            ) {
              resolvedDatabaseType = "mariadb"
              apiToUse = mariadbApi
            } else {
              console.warn(
                "⚠️ [useDataBase] MariaDBに接続できないため SQLite で取得します",
                {
                  connected:
                    mariaDbConnectionResult?.connected,

                  switchedDatabaseType:
                    mariaDbConnectionResult
                      ?.switchedDatabaseType,

                  fallbackToSqlite:
                    mariaDbConnectionResult
                      ?.fallbackToSqlite,

                  currentDatabaseType:
                    mariaDbConnectionResult
                      ?.currentDatabaseType,
                }
              )

              resolvedDatabaseType = "sqlite"
              apiToUse = sqliteApi
            }
          }
        }

        console.log(
          "🔍 [useDataBase] 最終的に使用するDB/API:",
          {
            loadId,
            reason,
            force,
            useAutoSwitching,
            resolvedDatabaseType,

            apiName:
              apiToUse === laravelApi
                ? "laravelApi"
                : apiToUse === mariadbApi
                  ? "mariadbApi"
                  : apiToUse === sqliteApi
                    ? "sqliteApi"
                    : "unknown",

            checkedMariaDbConnection,
            mariaDbConnectionResult,
            laravelConnectionResult,
          }
        )

        // =============================================================
        // 全テーブル取得
        // =============================================================
        const tables = await apiToUse.getAllTables()

        if (!tables) {
          console.error(
            "❌ [useDataBase] テーブル取得失敗"
          )

          console.groupEnd()
          return false
        }

        console.log(
          "⭐ [useDataBase] 取得した全テーブル:",
          tables
        )

        // =============================================================
        // databaseSlice に全テーブルを保存
        // ここでは抽出しない
        // =============================================================
        await dispatch(fetchAllTables(tables))
        await dispatch(fetchLaravelAuthState())

        console.log(
          "✅ [useDataBase] databaseSlice 保存完了:",
          {
            loadId,
            reason,
            force,
            useAutoSwitching,
            resolvedDatabaseType,

            tableKeys: Object.keys(tables),

            counts: Object.fromEntries(
              Object.entries(tables).map(
                ([key, value]) => [
                  key,
                  Array.isArray(value)
                    ? value.length
                    : "not array",
                ]
              )
            ),
          }
        )

        console.groupEnd()

        return true
      } catch (error) {
        console.error(
          "❌ [useDataBase] DBテーブル読み込みエラー:",
          error
        )

        console.groupEnd()

        return false
      } finally {
        loadingRef.current = false
      }
    },
    [
      autoLoad,
      isInitialized,
      databaseType,
      databaseTypeFromRedux,
      dispatch,
      resolveApiByDatabaseType,
    ]
  )

  // =============================================================
  // DB全テーブル再読み込み
  //
  // 用途:
  // - データ追加後
  // - データ更新後
  // - データ削除後
  // - 手動更新ボタン
  //
  // 重要:
  // - 現在選択中のDB/APIを使用する
  // - AUTO_SWITCHING は実行しない
  // - force=true で強制的に再取得する
  // =============================================================
  const reloadData = useCallback(
    async (options = {}) => {
      console.log(
        "🔄 [useDataBase] reloadData 開始",
        options
      )

      try {
        const result = await loadDataBase({
          ...options,

          // reloadData は常に強制再取得
          force: true,

          // reason が指定されていなければデフォルト値
          reason:
            options.reason || "manual-reload",

          // 初回起動時以外は自動切り替えを使用しない
          useAutoSwitching: false,
        })

        if (result) {
          console.log(
            "✅ [useDataBase] reloadData 完了"
          )
        } else {
          console.warn(
            "⚠️ [useDataBase] reloadData 失敗"
          )
        }

        return result
      } catch (error) {
        console.error(
          "❌ [useDataBase] reloadData エラー:",
          error
        )

        return false
      }
    },
    [loadDataBase]
  )

  // =============================================================
  // DB種別変更イベント
  //
  // 重要:
  // - database-type-changed はDB取得元が変わるので再取得する
  // - ここでは AUTO_SWITCHING は使わない
  // - 明示的なDB変更イベントなので、渡されたDB種別を優先する
  // =============================================================
  useEffect(() => {
    if (!autoLoad) {
      return undefined
    }

    const handleDatabaseTypeChanged = async (
      event
    ) => {
      const nextDatabaseType =
        event?.detail?.databaseType || "mariadb"

      console.log(
        "🔁 [useDataBase] database-type-changed 受信",
        {
          nextDatabaseType,
          detail: event?.detail,
        }
      )

      resetChilledspace()

      await loadDataBase({
        reason: "event/database-type-changed",
        forceDatabaseType: nextDatabaseType,
        useAutoSwitching: false,
      })
    }

    window.addEventListener(
      "database-type-changed",
      handleDatabaseTypeChanged
    )

    return () => {
      window.removeEventListener(
        "database-type-changed",
        handleDatabaseTypeChanged
      )
    }
  }, [
    autoLoad,
    loadDataBase,
    resetChilledspace,
  ])

  // =============================================================
  // 初期化完了後に1回だけ自動取得
  //
  // 重要:
  // - autoLoad=true のインスタンスだけ実行
  // - isInitialized が true になったら1回だけ全テーブル取得
  // - ここだけ useAutoSwitching=true を渡す
  // - つまり AUTO_SWITCHING を見るのは初回読み込み時だけ
  // =============================================================
  useEffect(() => {
    if (!autoLoad) return
    if (didAutoLoadRef.current) return

    if (!isInitialized) {
      console.log(
        "⏳ [useDataBase] autoLoad 待機中",
        {
          isInitialized,
        }
      )

      return
    }

    didAutoLoadRef.current = true

    loadDataBase({
      reason:
        "autoLoad/after-initialized-once",
      useAutoSwitching: true,
    })
  }, [
    autoLoad,
    isInitialized,
    loadDataBase,
  ])

  // =============================================================
  // return
  // =============================================================
  return {
    loadDataBase,
    reloadData,
  }
}
