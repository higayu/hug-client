import { LARAVEL_ONLY_MODE } from "./databaseMode";
// renderer/src/hooks/useDataBase/checkMariaDbConnection.js

import {
  setDatabaseType,
  setServerConnectionState,
  updateAppState,
} from "@/store/slices/appStateSlice";

/**
 * boolean / string boolean を吸収する
 */
function toBooleanFlag(value, defaultValue = true) {
  if (value === true || value === "true") return true;
  if (value === false || value === "false") return false;
  return defaultValue;
}

/**
 * DATABASE_TYPE の表記揺れを吸収する
 */
function normalizeDatabaseType(value) {
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (normalized === "mariadb") return "mariadb";
    if (normalized === "laravel") return "laravel";
    if (normalized === "sqlite") return "sqlite";

    return "sqlite";
  }

  if (value && typeof value === "object") {
    const dbType =
      value.type ||
      value.databaseType ||
      value.dbType ||
      value.DATABASE_TYPE ||
      "sqlite";

    return normalizeDatabaseType(dbType);
  }

  return "sqlite";
}

/**
 * 現在の DATABASE_TYPE を取得する
 *
 * 重要:
 * 今の正本は Redux → window.AppState。
 *
 * 優先順位:
 * 1. window.AppState.DATABASE_TYPE
 * 2. window.getApiSettings().databaseType
 * 3. window.IniState.apiSettings.databaseType
 * 4. electronAPI.getDatabaseType()
 * 5. sqlite
 */
async function getCurrentDatabaseType() {
  console.group("🧭 [getCurrentDatabaseType] DATABASE_TYPE取得");

  // =============================================================
  // 1) Redux のミラーである window.AppState を最優先
  // =============================================================
  const appStateValue =
    window.AppState?.DATABASE_TYPE ||
    window.AppState?.databaseType ||
    window.AppState?.dbType;

  if (appStateValue !== undefined && appStateValue !== null) {
    const normalized = normalizeDatabaseType(appStateValue);

    console.log("✅ AppState DATABASE_TYPE:", {
      raw: appStateValue,
      normalized,
    });

    console.groupEnd();
    return normalized;
  }

  // =============================================================
  // 2) AppStateContext の getApiSettings
  // useWindowBridge により window 直下に公開される
  // =============================================================
  try {
    if (typeof window.getApiSettings === "function") {
      const apiSettings = window.getApiSettings();
      const apiSettingsDatabaseType = apiSettings?.databaseType;

      if (
        apiSettingsDatabaseType !== undefined &&
        apiSettingsDatabaseType !== null
      ) {
        const normalized = normalizeDatabaseType(apiSettingsDatabaseType);

        console.log("✅ window.getApiSettings databaseType:", {
          raw: apiSettingsDatabaseType,
          normalized,
          apiSettings,
        });

        console.groupEnd();
        return normalized;
      }
    }
  } catch (error) {
    console.warn("⚠️ window.getApiSettings 取得エラー:", error);
  }

  // =============================================================
  // 3) 旧互換: window.IniState
  // =============================================================
  const iniValue = window.IniState?.apiSettings?.databaseType;

  if (iniValue !== undefined && iniValue !== null) {
    const normalized = normalizeDatabaseType(iniValue);

    console.log("✅ IniState databaseType:", {
      raw: iniValue,
      normalized,
    });

    console.groupEnd();
    return normalized;
  }

  // =============================================================
  // 4) 最後に electronAPI.getDatabaseType
  //
  // ここを先に見ると、古い ini / main 側の値によって
  // Redux上は mariadb なのに sqlite と誤判定する可能性がある。
  // =============================================================
  try {
    if (typeof window.electronAPI?.getDatabaseType === "function") {
      const result = await window.electronAPI.getDatabaseType();
      const normalized = normalizeDatabaseType(result);

      console.log("✅ electronAPI.getDatabaseType:", {
        raw: result,
        normalized,
      });

      console.groupEnd();
      return normalized;
    }

    console.warn("⚠️ electronAPI.getDatabaseType がありません");
  } catch (error) {
    console.warn("⚠️ electronAPI.getDatabaseType 取得エラー:", error);
  }

  console.warn("⚠️ DATABASE_TYPE を取得できないため sqlite 扱いにします");
  console.groupEnd();

  return "sqlite";
}

/**
 * AUTO_SWITCHING を取得する
 *
 * 優先順位:
 * 1. window.AppState.AUTO_SWITCHING
 * 2. window.isAutoSwitchingEnabled()
 * 3. window.getApiSettings().autoSwitching
 * 4. window.IniState.apiSettings.autoSwitching
 * 5. true
 */
function getAutoSwitchingEnabled() {
  console.group("🔀 [getAutoSwitchingEnabled] AUTO_SWITCHING取得");

  // =============================================================
  // 1) Redux のミラーである window.AppState を最優先
  // =============================================================
  if (window.AppState?.AUTO_SWITCHING !== undefined) {
    const result = toBooleanFlag(window.AppState.AUTO_SWITCHING, true);

    console.log("✅ AppState AUTO_SWITCHING:", {
      raw: window.AppState.AUTO_SWITCHING,
      result,
    });

    console.groupEnd();
    return result;
  }

  // =============================================================
  // 2) useWindowBridge により window 直下に公開される関数
  // =============================================================
  if (typeof window.isAutoSwitchingEnabled === "function") {
    const fnResult = window.isAutoSwitchingEnabled();
    const result = toBooleanFlag(fnResult, true);

    console.log("✅ window.isAutoSwitchingEnabled:", {
      raw: fnResult,
      result,
    });

    console.groupEnd();
    return result;
  }

  // =============================================================
  // 3) AppStateContext の getApiSettings
  // =============================================================
  try {
    if (typeof window.getApiSettings === "function") {
      const apiSettings = window.getApiSettings();
      const apiSettingsAutoSwitching = apiSettings?.autoSwitching;

      if (
        apiSettingsAutoSwitching !== undefined &&
        apiSettingsAutoSwitching !== null
      ) {
        const result = toBooleanFlag(apiSettingsAutoSwitching, true);

        console.log("✅ window.getApiSettings autoSwitching:", {
          raw: apiSettingsAutoSwitching,
          result,
          apiSettings,
        });

        console.groupEnd();
        return result;
      }
    }
  } catch (error) {
    console.warn("⚠️ window.getApiSettings autoSwitching 取得エラー:", error);
  }

  // =============================================================
  // 4) 旧互換: window.IniState
  // =============================================================
  const iniValue = window.IniState?.apiSettings?.autoSwitching;

  if (iniValue !== undefined && iniValue !== null) {
    const result = toBooleanFlag(iniValue, true);

    console.log("✅ IniState autoSwitching:", {
      raw: iniValue,
      result,
    });

    console.groupEnd();
    return result;
  }

  // =============================================================
  // 5) 旧参照方式
  // 基本的には存在しない想定
  // =============================================================
  if (typeof window.AppState?.isAutoSwitchingEnabled === "function") {
    const appStateResult = window.AppState.isAutoSwitchingEnabled();
    const result = toBooleanFlag(appStateResult, true);

    console.log("✅ AppState isAutoSwitchingEnabled:", {
      raw: appStateResult,
      result,
    });

    console.groupEnd();
    return result;
  }

  console.warn("⚠️ AUTO_SWITCHING を取得できないため true 扱いにします");
  console.groupEnd();

  return true;
}

/**
 * MariaDB / APIサーバ接続確認
 *
 * 方針:
 * - activeApi は使わない
 * - DATABASE_TYPE を Redux / window.AppState の正本にする
 * - AUTO_SWITCHING の切替先は Laravel のため、この関数では参照のみ行う
 * - MariaDB中に接続失敗した場合は SQLite へ fallback する
 * - fallback時は Redux / ini.json / window.AppState / ApiTab select をまとめて更新する
 *
 * @param {Function} dispatch Redux dispatch
 * @param {Object} options オプション
 * @param {boolean} options.autoFallbackToSqlite 接続失敗時にSQLiteへ切り替えるか
 * @param {boolean} options.switchToMariaDbOnSuccess 接続成功時にMariaDBへ切り替えるか
 * @param {boolean} options.persistIni ini.jsonも更新するか
 * @returns {Promise<Object>} 接続確認結果
 */
export async function checkMariaDbConnection(dispatch, options = {}) {
  if (LARAVEL_ONLY_MODE) {
    return { success: false, connected: false, databaseType: "laravel", message: "MariaDB接続確認はLaravel専用モードで無効です。" };
  }
  const {
    autoFallbackToSqlite = true,
    switchToMariaDbOnSuccess = false,
    persistIni = true,
  } = options;

  const checkedAt = new Date().toISOString();

  console.group("🔌 [checkMariaDbConnection] MariaDB接続確認開始");

  const currentDatabaseType = await getCurrentDatabaseType();
  const autoSwitching = getAutoSwitchingEnabled();

  console.log("📌 options:", {
    autoFallbackToSqlite,
    switchToMariaDbOnSuccess,
    persistIni,
  });

  console.log("📌 current settings:", {
    currentDatabaseType,
    autoSwitching,

    rawAppStateDatabaseType: window.AppState?.DATABASE_TYPE,
    rawAppStateAutoSwitching: window.AppState?.AUTO_SWITCHING,

    rawIniDatabaseType: window.IniState?.apiSettings?.databaseType,
    rawIniAutoSwitching: window.IniState?.apiSettings?.autoSwitching,

    hasWindowGetApiSettings: typeof window.getApiSettings === "function",
    hasWindowLoadIni: typeof window.loadIni === "function",
    hasWindowUpdateIniSetting: typeof window.updateIniSetting === "function",
  });

  console.log("🕒 checkedAt:", checkedAt);
  console.log("🧩 dispatch exists:", Boolean(dispatch));

  if (dispatch) {
    dispatch(
      setServerConnectionState({
        connected: false,
        checking: true,
        message: "MariaDB 接続確認中...",
        checkedAt,
      })
    );
  }

  try {
    if (!window.electronAPI?.checkMariaDbConnection) {
      throw new Error("checkMariaDbConnection が preload に定義されていません");
    }

    const res = await window.electronAPI.checkMariaDbConnection();

    console.log("📥 Electron IPC response:", res);

    const connected = res?.connected === true;

    const result = {
      success: res?.success === true,
      connected,
      checking: false,
      message:
        res?.message ||
        (connected
          ? "APIサーバに接続できました"
          : "APIサーバに接続できません"),
      serverHost: res?.serverHost || null,
      url: res?.url || null,
      status: res?.status || null,
      statusText: res?.statusText || null,
      code: res?.code || null,
      checkedAt,
      data: res?.data || null,
      error: null,

      currentDatabaseType,
      autoSwitching,

      switchedDatabaseType: null,
      fallbackToSqlite: false,
      autoSwitchingToMariaDb: false,
      switchResult: null,
    };

    console.log("🧾 normalized result:", result);

    if (dispatch) {
      dispatch(
        setServerConnectionState({
          connected,
          checking: false,
          message: result.message,
          checkedAt,
        })
      );
    }

    // =============================================================
    // MariaDB への明示切替
    //
    // 条件:
    // - 接続成功
    // - 現在 mariadb 以外
    // - switchToMariaDbOnSuccess=true
    //
    // AUTO_SWITCHING の切替先は Laravel API のため、ここでは判定に使用しない。
    // =============================================================
    const shouldSwitchToMariaDb =
      connected &&
      currentDatabaseType !== "mariadb" &&
      switchToMariaDbOnSuccess;

    console.log("🔀 MariaDB切替判定:", {
      connected,
      currentDatabaseType,
      autoSwitching,
      switchToMariaDbOnSuccess,
      shouldSwitchToMariaDb,
    });

    if (shouldSwitchToMariaDb) {
      const reason =
        "switchToMariaDbOnSuccess=true のため MariaDB に切り替えました";

      const switched = await switchDatabaseType({
        dispatch,
        databaseType: "mariadb",
        message: reason,
        persistIni,
      });

      const switchedResult = {
        ...result,
        message: switched.message,
        switchedDatabaseType: switched.databaseType,
        fallbackToSqlite: false,
        autoSwitchingToMariaDb: false,
        switchResult: switched,
      };

      console.log("✅ MariaDB自動切替完了 result:", switchedResult);
      console.groupEnd();

      return switchedResult;
    }

    // =============================================================
    // 接続成功だが切替しない
    // =============================================================
    if (connected) {
      console.log("✅ 接続成功。ただし DB切替なし:", {
        currentDatabaseType,
        autoSwitching,
        switchToMariaDbOnSuccess,
      });

      console.groupEnd();
      return result;
    }

    // =============================================================
    // 接続失敗時の SQLite fallback
    //
    // currentDatabaseType が mariadb の場合は必ず switchDatabaseType を呼ぶ。
    // ここで呼ばれないと、useDataBase 側だけ sqliteApi に逃げて
    // ini.json / Redux が mariadb のままになる。
    // =============================================================
    console.error("🚨 [checkMariaDbConnection] SQLite fallback 判定直前", {
      connected,
      autoFallbackToSqlite,
      currentDatabaseType,
      rawAppStateDatabaseType: window.AppState?.DATABASE_TYPE,
      rawIniDatabaseType: window.IniState?.apiSettings?.databaseType,
      shouldCallSwitchDatabaseType:
        !connected && autoFallbackToSqlite && currentDatabaseType !== "sqlite",
    });

    if (!connected && autoFallbackToSqlite) {
      if (currentDatabaseType === "sqlite") {
        const sqliteResult = {
          ...result,
          message:
            result.message ||
            "APIサーバに接続できません。現在 SQLite のため切替は行いません",
          switchedDatabaseType: null,
          fallbackToSqlite: false,
        };

        console.log("⏭ すでに SQLite のため fallback切替は省略:", sqliteResult);
        console.groupEnd();

        return sqliteResult;
      }

      const switched = await switchDatabaseType({
        dispatch,
        databaseType: "sqlite",
        message: "APIサーバに接続できないため SQLite に切り替えました",
        persistIni,
      });

      const fallbackResult = {
        ...result,
        message: switched.message,
        switchedDatabaseType: switched.databaseType,
        fallbackToSqlite: switched.success === true,
        switchResult: switched,
      };

      console.log("✅ SQLite自動切替完了 result:", fallbackResult);
      console.groupEnd();

      return fallbackResult;
    }

    console.log("✅ 接続確認のみ完了 result:", result);
    console.groupEnd();

    return result;
  } catch (err) {
    console.error("❌ [checkMariaDbConnection] 接続確認エラー:", err);

    const baseResult = {
      success: false,
      connected: false,
      checking: false,
      message: err?.message || "接続確認に失敗しました",
      serverHost: null,
      url: null,
      status: err?.response?.status || null,
      statusText: err?.response?.statusText || null,
      code: err?.code || null,
      checkedAt,
      data: err?.response?.data || null,
      error: {
        name: err?.name || "Error",
        message: err?.message || "接続確認に失敗しました",
      },

      currentDatabaseType,
      autoSwitching,

      switchedDatabaseType: null,
      fallbackToSqlite: false,
      autoSwitchingToMariaDb: false,
      switchResult: null,
    };

    if (dispatch) {
      dispatch(
        setServerConnectionState({
          connected: false,
          checking: false,
          message: baseResult.message,
          checkedAt,
        })
      );
    }

    console.error("🚨 [checkMariaDbConnection] 例外後 SQLite fallback 判定直前", {
      autoFallbackToSqlite,
      currentDatabaseType,
      rawAppStateDatabaseType: window.AppState?.DATABASE_TYPE,
      rawIniDatabaseType: window.IniState?.apiSettings?.databaseType,
      shouldCallSwitchDatabaseType:
        autoFallbackToSqlite && currentDatabaseType !== "sqlite",
    });

    if (autoFallbackToSqlite) {
      if (currentDatabaseType === "sqlite") {
        const sqliteResult = {
          ...baseResult,
          message:
            baseResult.message ||
            "接続確認に失敗しました。現在 SQLite のため切替は行いません",
          switchedDatabaseType: null,
          fallbackToSqlite: false,
        };

        console.log("⏭ 例外後、すでに SQLite のため fallback省略:", sqliteResult);
        console.groupEnd();

        return sqliteResult;
      }

      const switched = await switchDatabaseType({
        dispatch,
        databaseType: "sqlite",
        message: "接続確認に失敗したため SQLite に切り替えました",
        persistIni,
      });

      const fallbackResult = {
        ...baseResult,
        message: switched.message,
        switchedDatabaseType: switched.databaseType,
        fallbackToSqlite: switched.success === true,
        switchResult: switched,
      };

      console.log("✅ 例外後 SQLite自動切替完了 result:", fallbackResult);
      console.groupEnd();

      return fallbackResult;
    }

    console.log("✅ エラー結果を返します:", baseResult);
    console.groupEnd();

    return baseResult;
  }
}

/**
 * DB種別をまとめて切り替える
 *
 * 方針:
 * - activeApi は使わない
 * - Redux の DATABASE_TYPE を必ず更新する
 * - ini.json を必要に応じて更新する
 * - AppStateContext 側の iniState を可能なら更新する
 * - 最後に Redux / window.AppState / ApiTab select を確定する
 */
export async function switchDatabaseType({
  dispatch,
  databaseType,
  message = "",
  persistIni = true,
}) {
  const checkedAt = new Date().toISOString();

  const resolvedDatabaseType = normalizeDatabaseType(databaseType);
  if (LARAVEL_ONLY_MODE && resolvedDatabaseType !== "laravel") {
    return { success: false, connected: false, databaseType: "laravel", message: "Laravel専用モードのためDB種別を変更できません。" };
  }

  const resolvedMessage =
    message ||
    (resolvedDatabaseType === "mariadb"
      ? "MariaDB に切り替えました"
      : resolvedDatabaseType === "laravel"
        ? "Laravel API に切り替えました"
        : "SQLite に切り替えました");

  console.group("🔁 [switchDatabaseType] DB種別切替開始");
  console.log("📌 params:", {
    databaseType,
    resolvedDatabaseType,
    resolvedMessage,
    persistIni,
    checkedAt,
    dispatchExists: Boolean(dispatch),
  });

  try {
    // =============================================================
    // 1) Redux を先に更新する
    // =============================================================
    if (dispatch) {
      applyDatabaseTypeToRedux(dispatch, {
        databaseType: resolvedDatabaseType,
        message: resolvedMessage,
        checkedAt,
      });
    } else {
      console.warn("⚠️ dispatch がないため Redux は更新されません");
    }

    // =============================================================
    // 2) window.AppState を即時同期
    // Reactの再描画を待たず、互換参照側でも即座に値が見えるようにする
    // =============================================================
    syncWindowAppStateDatabaseType({
      databaseType: resolvedDatabaseType,
      message: resolvedMessage,
      checkedAt,
    });

    // =============================================================
    // 3) ini.json / AppStateContext iniState を更新する
    // =============================================================
    let iniResult = {
      success: true,
      skipped: true,
      message: "persistIni=false のため ini.json は更新しません",
    };

    if (persistIni) {
      iniResult = await updateIniDatabaseType(resolvedDatabaseType);
      console.log("💾 ini.json 更新結果:", iniResult);
    } else {
      console.log("💾 persistIni=false のため ini.json は更新しません");
    }

    // =============================================================
    // 4) AppStateContext / iniState 側を再読み込みする
    // =============================================================
    const reloadResult = await reloadIniStateIfPossible();

    // =============================================================
    // 5) Redux を最後にもう一度確定する
    // iniState 側の useEffect による巻き戻り対策
    // =============================================================
    if (dispatch) {
      applyDatabaseTypeToRedux(dispatch, {
        databaseType: resolvedDatabaseType,
        message: resolvedMessage,
        checkedAt,
      });
    }

    // =============================================================
    // 6) window.AppState をもう一度確定
    // =============================================================
    syncWindowAppStateDatabaseType({
      databaseType: resolvedDatabaseType,
      message: resolvedMessage,
      checkedAt,
    });

    // =============================================================
    // 7) ApiTab select 表示同期
    // =============================================================
    syncDatabaseTypeSelect(resolvedDatabaseType);

    // =============================================================
    // 8) DB切替完了イベントを発火
    // useDataBase 側の再取得トリガー
    // =============================================================
    window.dispatchEvent(
      new CustomEvent("database-type-changed", {
        detail: {
          databaseType: resolvedDatabaseType,
          message: resolvedMessage,
          checkedAt,
          source: "switchDatabaseType",
          iniResult,
          reloadResult,
        },
      })
    );

    const result = {
      success: true,
      connected: resolvedDatabaseType !== "sqlite",
      databaseType: resolvedDatabaseType,
      message: resolvedMessage,
      checkedAt,
      iniResult,
      reloadResult,
    };

    console.log("✅ [switchDatabaseType] DB種別切替完了:", result);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ [switchDatabaseType] DB種別切替エラー:", error);

    if (dispatch) {
      dispatch(
        setServerConnectionState({
          connected: false,
          checking: false,
          message: error?.message || "DB種別切替に失敗しました",
          checkedAt,
        })
      );
    }

    const result = {
      success: false,
      connected: false,
      databaseType: resolvedDatabaseType,
      message: error?.message || "DB種別切替に失敗しました",
      checkedAt,
      error,
    };

    console.log("===== switchDatabaseType END failed =====", result);
    console.groupEnd();

    return result;
  }
}

/**
 * Redux に DATABASE_TYPE / サーバ接続状態を反映
 */
function applyDatabaseTypeToRedux(
  dispatch,
  {
    databaseType,
    message,
    checkedAt,
  }
) {
  const connected = databaseType !== "sqlite";

  console.log("📤 [applyDatabaseTypeToRedux]", {
    databaseType,
    connected,
    message,
    checkedAt,
  });

  dispatch(setDatabaseType(databaseType));

  dispatch(
    updateAppState({
      DATABASE_TYPE: databaseType,
      SERVER_CONNECTED: connected,
      SERVER_CONNECTION_CHECKING: false,
      SERVER_CONNECTION_MESSAGE: message,
      SERVER_CONNECTION_CHECKED_AT: checkedAt,
    })
  );

  dispatch(
    setServerConnectionState({
      connected,
      checking: false,
      message,
      checkedAt,
    })
  );
}

/**
 * window.AppState の互換ミラーを即時更新
 */
function syncWindowAppStateDatabaseType({
  databaseType,
  message,
  checkedAt,
}) {
  console.group("🪟 [syncWindowAppStateDatabaseType] window.AppState同期");

  if (!window.AppState) {
    console.warn("⚠️ window.AppState がないため同期できません");
    console.groupEnd();
    return false;
  }

  window.AppState.DATABASE_TYPE = databaseType;
  window.AppState.SERVER_CONNECTED = databaseType !== "sqlite";
  window.AppState.SERVER_CONNECTION_CHECKING = false;
  window.AppState.SERVER_CONNECTION_MESSAGE = message;
  window.AppState.SERVER_CONNECTION_CHECKED_AT = checkedAt;

  console.log("✅ window.AppState updated:", {
    DATABASE_TYPE: window.AppState.DATABASE_TYPE,
    SERVER_CONNECTED: window.AppState.SERVER_CONNECTED,
    SERVER_CONNECTION_MESSAGE: window.AppState.SERVER_CONNECTION_MESSAGE,
  });

  console.groupEnd();
  return true;
}

/**
 * ini.json の apiSettings.databaseType を更新
 *
 * 優先順位:
 * 1. window.updateIniSetting
 *    AppStateContext 側の iniState も更新されるため最優先
 * 2. window.electronAPI.updateIniSetting
 *    preload直呼びのfallback
 */
async function updateIniDatabaseType(databaseType) {
  console.group("💾 [updateIniDatabaseType] ini.json更新");

  const normalizedDatabaseType = normalizeDatabaseType(databaseType);

  try {
    // =============================================================
    // 1) AppStateContext 経由
    // window.updateIniSetting は useWindowBridge により window 直下に公開される
    // =============================================================
    if (typeof window.updateIniSetting === "function") {
      const res = await window.updateIniSetting(
        "apiSettings.databaseType",
        normalizedDatabaseType
      );

      const result = normalizeIniUpdateResult(res, {
        source: "window.updateIniSetting",
        databaseType: normalizedDatabaseType,
      });

      console.log("✅ ini databaseType updated via window.updateIniSetting:", {
        databaseType: normalizedDatabaseType,
        rawResult: res,
        result,
      });

      console.groupEnd();
      return result;
    }

    // =============================================================
    // 2) preload 経由 fallback
    // =============================================================
    if (typeof window.electronAPI?.updateIniSetting === "function") {
      const res = await window.electronAPI.updateIniSetting(
        "apiSettings.databaseType",
        normalizedDatabaseType
      );

      const result = normalizeIniUpdateResult(res, {
        source: "electronAPI.updateIniSetting",
        databaseType: normalizedDatabaseType,
      });

      console.log("✅ ini databaseType updated via electronAPI:", {
        databaseType: normalizedDatabaseType,
        rawResult: res,
        result,
      });

      console.groupEnd();
      return result;
    }

    const result = {
      success: false,
      source: null,
      databaseType: normalizedDatabaseType,
      message:
        "updateIniSetting が window / preload のどちらにも定義されていません",
    };

    console.warn("⚠️", result.message);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ ini.json の databaseType 更新に失敗しました:", error);

    const result = {
      success: false,
      source: "updateIniDatabaseType",
      databaseType: normalizedDatabaseType,
      message: error?.message || "ini.json の更新に失敗しました",
      error,
    };

    console.groupEnd();

    return result;
  }
}

/**
 * ini更新結果を正規化する
 */
function normalizeIniUpdateResult(res, extra = {}) {
  if (res === false) {
    return {
      success: false,
      ...extra,
      rawResult: res,
      message: "ini.json の更新が false を返しました",
    };
  }

  if (res && typeof res === "object" && res.success === false) {
    return {
      success: false,
      ...extra,
      rawResult: res,
      message: res.message || res.error || "ini.json の更新に失敗しました",
    };
  }

  return {
    success: true,
    ...extra,
    rawResult: res,
    message: "ini.json を更新しました",
  };
}

/**
 * AppStateContext 側の iniState を再読み込み
 */
async function reloadIniStateIfPossible() {
  console.group("🔄 [reloadIniStateIfPossible] iniState 再読み込み");

  try {
    // =============================================================
    // useWindowBridge で window 直下に公開される loadIni
    // =============================================================
    if (typeof window.loadIni === "function") {
      const result = await window.loadIni();

      console.log("✅ window.loadIni 実行完了:", result);
      console.groupEnd();

      return {
        success: true,
        source: "window.loadIni",
        result,
      };
    }

    // =============================================================
    // 旧互換
    // =============================================================
    if (window.IniState?.loadIni) {
      const result = await window.IniState.loadIni();

      console.log("✅ window.IniState.loadIni 実行完了:", result);
      console.groupEnd();

      return {
        success: true,
        source: "window.IniState.loadIni",
        result,
      };
    }

    const result = {
      success: false,
      source: null,
      message:
        "iniState 再読み込み関数が window に見つかりません。AppStateContext 側で loadIni を useWindowBridge に公開してください。",
    };

    console.warn("⚠️", result.message);
    console.groupEnd();

    return result;
  } catch (error) {
    console.error("❌ iniState 再読み込みエラー:", error);

    const result = {
      success: false,
      source: "reloadIniStateIfPossible",
      message: error?.message || "iniState 再読み込みエラー",
      error,
    };

    console.groupEnd();

    return result;
  }
}

/**
 * ApiTab の select 表示を同期
 */
function syncDatabaseTypeSelect(databaseType) {
  console.group("🖥 [syncDatabaseTypeSelect] ApiTab select同期");

  const databaseTypeSelect = document.getElementById("api-database-type");

  if (databaseTypeSelect) {
    databaseTypeSelect.value = databaseType;
    console.log("✅ select value 更新:", databaseType);
  } else {
    console.warn(
      "⚠️ #api-database-type が見つかりません。ApiTab未表示の可能性があります。"
    );
  }

  console.groupEnd();
}
