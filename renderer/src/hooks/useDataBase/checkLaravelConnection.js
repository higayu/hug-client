import { LARAVEL_ONLY_MODE } from "./databaseMode";
import { switchDatabaseType } from "./checkMariaDbConnection";

/**
 * Laravel APIへ接続できることを確認し、必要に応じてDB種別を切り替える。
 */
export async function checkLaravelConnection(
  dispatch,
  {
    autoFallbackToSqlite = true,
    switchToLaravelOnSuccess = true,
    persistIni = true,
  } = {},
) {
  try {
    if (
      typeof window.electronAPI?.checkLaravelConnection !== "function"
    ) {
      throw new Error(
        "checkLaravelConnectionがpreloadに登録されていません。",
      );
    }

    const connectionResult =
      await window.electronAPI.checkLaravelConnection();

    if (!connectionResult?.connected) {
      if (autoFallbackToSqlite && !LARAVEL_ONLY_MODE) {
        const switched = await switchDatabaseType({
          dispatch,
          databaseType: "sqlite",
          message:
            connectionResult?.message ||
            "Laravel APIに接続できないためSQLiteを使用します。",
          persistIni,
        });

        return {
          ...connectionResult,
          connected: false,
          switchedDatabaseType: switched.databaseType,
        };
      }

      return connectionResult;
    }

    if (!switchToLaravelOnSuccess) {
      return {
        ...connectionResult,
        switchedDatabaseType: null,
      };
    }

    const switched = await switchDatabaseType({
      dispatch,
      databaseType: "laravel",
      message: "Laravel APIに切り替えました。",
      persistIni,
    });

    return {
      ...connectionResult,
      success: switched.success,
      connected: switched.success,
      databaseType: switched.databaseType,
      switchedDatabaseType: switched.databaseType,
      message: switched.message,
    };
  } catch (error) {
    console.error("❌ [checkLaravelConnection] 接続確認エラー:", error);

    return {
      success: false,
      connected: false,
      message:
        error?.message || "Laravel APIへの接続確認に失敗しました。",
      error,
    };
  }
}

export { switchDatabaseType };
