import React, { useState } from "react";
import { Wifi, WifiOff, Loader2 } from "lucide-react";
import { useAppState } from "@/AppStateContext";

const toDatabaseType = (value) => {
  const normalized = String(value || "").trim().toLowerCase();

  if (normalized === "laravel" || normalized === "mariadb") {
    return normalized;
  }

  return "sqlite";
};

const ServerConnectButton = ({
  className = "",
  autoFallbackToSqlite = true,
  switchToMariaDbOnSuccess = true,
  persistIni = true,
}) => {
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null);

  const {
    updateAppState,
    updateIniSetting,
    DATABASE_TYPE,
    SERVER_CONNECTED,
    SERVER_CONNECTION_STATE,
    SERVER_CONNECTION_CHECKING,
    SERVER_CONNECTION_MESSAGE,
    SERVER_CONNECTION_CHECKED_AT,
  } = useAppState();

  const databaseType = toDatabaseType(DATABASE_TYPE);
  const isMariaDb = databaseType === "mariadb";
  const isLaravel = databaseType === "laravel";

  const appStateConnected =
    SERVER_CONNECTED === true || SERVER_CONNECTION_STATE === "connected";

  const isConnected =
    result?.connected === true || appStateConnected || isMariaDb || isLaravel;

  const isChecking = checking || SERVER_CONNECTION_CHECKING === true;
  const checkedAt = result?.checkedAt || SERVER_CONNECTION_CHECKED_AT;

  const currentLabel = isLaravel
    ? "Laravel API"
    : isMariaDb
      ? "MariaDB / API"
      : "SQLite";

  const displayMessage =
    result?.message ||
    SERVER_CONNECTION_MESSAGE ||
    (isConnected
      ? `${currentLabel} に接続済みです`
      : `${currentLabel} に接続していません`);

  const titleText = [
    isChecking
      ? `${currentLabel} 接続確認中...`
      : isConnected
        ? `${currentLabel} 接続 OK`
        : result
          ? `${currentLabel} 接続 NG`
          : `${currentLabel} 接続を確認`,
    displayMessage,
    DATABASE_TYPE ? `DATABASE_TYPE: ${DATABASE_TYPE}` : null,
    checkedAt ? `checkedAt: ${checkedAt}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const syncDatabaseType = async (nextDatabaseType, message) => {
    const connected =
      nextDatabaseType === "mariadb" || nextDatabaseType === "laravel";
    const checkedAtValue = new Date().toISOString();

    updateAppState({
      DATABASE_TYPE: nextDatabaseType,
      SERVER_CONNECTED: connected,
      SERVER_CONNECTION_STATE: connected ? "connected" : "disconnected",
      SERVER_CONNECTION_CHECKING: false,
      SERVER_CONNECTION_MESSAGE:
        message ||
        (connected
          ? `${nextDatabaseType} に切り替えました`
          : "SQLite に切り替えました"),
      SERVER_CONNECTION_CHECKED_AT: checkedAtValue,
    });

    if (persistIni) {
      await updateIniSetting("apiSettings.databaseType", nextDatabaseType);
    }
  };

  const handleCheckConnection = async () => {
    void 0;

    setChecking(true);
    setResult(null);

    updateAppState({
      SERVER_CONNECTION_CHECKING: true,
      SERVER_CONNECTION_MESSAGE: `${currentLabel} 接続確認中...`,
    });

    try {
      const checkConnection = isLaravel
        ? window.electronAPI?.checkLaravelConnection
        : window.electronAPI?.checkMariaDbConnection;

      if (typeof checkConnection !== "function") {
        throw new Error(
          isLaravel
            ? "checkLaravelConnection が preload に定義されていません"
            : "checkMariaDbConnection が preload に定義されていません"
        );
      }

      const res = await checkConnection();
      const connected = res?.connected === true || res?.success === true;
      const checkedAtValue = new Date().toISOString();

      const normalizedResult = {
        ...res,
        success: connected,
        connected,
        checking: false,
        checkedAt: checkedAtValue,
        message:
          res?.message ||
          (connected
            ? `${currentLabel} に接続できました`
            : `${currentLabel} に接続できません`),
      };

      setResult(normalizedResult);

      updateAppState({
        SERVER_CONNECTED: connected,
        SERVER_CONNECTION_STATE: connected ? "connected" : "disconnected",
        SERVER_CONNECTION_CHECKING: false,
        SERVER_CONNECTION_MESSAGE: normalizedResult.message,
        SERVER_CONNECTION_CHECKED_AT: checkedAtValue,
      });

      if (connected) {
        if (isLaravel) {
          await syncDatabaseType(
            "laravel",
            "Laravel API に接続できたため Laravel に切り替えました"
          );
        } else if (switchToMariaDbOnSuccess) {
          await syncDatabaseType(
            "mariadb",
            "API サーバーに接続できたため MariaDB に切り替えました"
          );
        }

        return;
      }

      if (autoFallbackToSqlite) {
        await syncDatabaseType(
          "sqlite",
          `${currentLabel} に接続できないため SQLite に切り替えました`
        );
      }
    } catch (err) {
      console.error("[ServerConnectButton] connection check error:", err);

      const checkedAtValue = new Date().toISOString();
      const errorResult = {
        success: false,
        connected: false,
        checking: false,
        checkedAt: checkedAtValue,
        message: err?.message || "接続確認に失敗しました",
      };

      setResult(errorResult);

      updateAppState({
        SERVER_CONNECTED: false,
        SERVER_CONNECTION_STATE: "disconnected",
        SERVER_CONNECTION_CHECKING: false,
        SERVER_CONNECTION_MESSAGE: errorResult.message,
        SERVER_CONNECTION_CHECKED_AT: checkedAtValue,
      });

      if (autoFallbackToSqlite) {
        await syncDatabaseType(
          "sqlite",
          "接続確認に失敗したため SQLite に切り替えました"
        );
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className={`${className} inline-flex items-center`}>
      <button
        type="button"
        onClick={handleCheckConnection}
        disabled={isChecking}
        title={titleText}
        aria-label={titleText}
        className={[
          "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition",
          "border shadow-sm",
          isChecking
            ? "cursor-not-allowed bg-gray-100 text-gray-500"
            : "bg-white text-gray-800 hover:bg-gray-300",
          className,
        ].join(" ")}
      >
        {isChecking ? (
          <Loader2 size={18} className="animate-spin" />
        ) : isConnected ? (
          <Wifi size={18} className="text-green-600" />
        ) : result || SERVER_CONNECTION_MESSAGE ? (
          <WifiOff size={18} className="text-red-600" />
        ) : (
          <Wifi size={18} />
        )}

        <span>サーバー接続</span>
      </button>
    </div>
  );
};

export default ServerConnectButton;
