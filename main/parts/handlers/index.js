// main/parts/handlers/index.js

const fs = require("fs");
const path = require("path");
const { app } = require("electron");

const {
  registerSqliteHandlers,
} = require("./sqliteHandler");

const {
  registerMariadbHandlers,
} = require("./mariadbHandler");

const {
  registerLaravelAuthHandlers,
} = require("./laravelAuthHandler");

/**
 * ini.jsonのパスを取得する。
 */
function resolveIniPath() {
  if (app.isPackaged) {
    return path.join(
      app.getPath("userData"),
      "data",
      "ini.json",
    );
  }

  return path.join(
    __dirname,
    "../../data/ini.json",
  );
}

/**
 * DB種別を正規化する。
 */
function normalizeDatabaseType(value) {
  const databaseType = String(value ?? "")
    .trim()
    .toLowerCase();

  if (
    databaseType === "sqlite" ||
    databaseType === "mariadb" ||
    databaseType === "laravel"
  ) {
    return databaseType;
  }

  return "mariadb";
}

/**
 * 現在使用するDB種別を取得する。
 */
function getDatabaseType() {
  try {
    const iniPath = resolveIniPath();

    if (!fs.existsSync(iniPath)) {
      console.warn(
        "⚠️ [getDatabaseType] ini.jsonが見つかりません:",
        iniPath,
      );

      return "sqlite";
    }

    const iniData = JSON.parse(
      fs.readFileSync(iniPath, "utf8"),
    );

    return normalizeDatabaseType(
      iniData?.apiSettings?.databaseType ?? "mariadb",
    );
  } catch (error) {
    console.error(
      "❌ [getDatabaseType] ini.jsonの読み込みに失敗しました:",
      error,
    );

    return "sqlite";
  }
}

/**
 * IPCハンドラーの重複登録を防ぐ。
 */
function removeHandlerIfRegistered(ipcMain, channel) {
  try {
    ipcMain.removeHandler(channel);
  } catch (error) {
    console.warn(
      `⚠️ IPCハンドラーを解除できませんでした: ${channel}`,
      error?.message ?? error,
    );
  }
}

/**
 * DB種別取得用IPCを登録する。
 */
function registerDatabaseTypeHandler(ipcMain) {
  const channel = "get-database-type";

  removeHandlerIfRegistered(ipcMain, channel);

  ipcMain.handle(channel, async () => getDatabaseType());
}

/**
 * DBモード切り替え用IPCを登録する。
 */
function registerDatabaseSwitchHandler(ipcMain) {
  const channel = "switch-database-mode";

  removeHandlerIfRegistered(ipcMain, channel);

  ipcMain.handle(channel, async (_event, newMode) => {
    try {
      const iniPath = resolveIniPath();

      if (!fs.existsSync(iniPath)) {
        throw new Error("ini.jsonが見つかりません。");
      }

      const iniData = JSON.parse(
        fs.readFileSync(iniPath, "utf8"),
      );

      if (
        !iniData.apiSettings ||
        typeof iniData.apiSettings !== "object" ||
        Array.isArray(iniData.apiSettings)
      ) {
        iniData.apiSettings = {};
      }

      const mode = normalizeDatabaseType(newMode);
      iniData.apiSettings.databaseType = mode;

      fs.writeFileSync(
        iniPath,
        JSON.stringify(iniData, null, 2),
        "utf8",
      );

      console.log(
        "🔄 [switch-database-mode] モード切り替え:",
        mode,
      );

      return {
        success: true,
        mode,
      };
    } catch (error) {
      console.error(
        "❌ [switch-database-mode] 切り替え失敗:",
        error,
      );

      return {
        success: false,
        error: error?.message ?? String(error),
      };
    }
  });
}

/**
 * IPCハンドラーをまとめて登録する。
 */
function handleApiCalls(ipcMain) {
  console.log("🔥 [handleApiCalls] START");

  if (!ipcMain || typeof ipcMain.handle !== "function") {
    throw new TypeError(
      "handleApiCallsにはElectronのipcMainを渡してください。",
    );
  }

  const registrars = [
    registerMariadbHandlers,
    registerSqliteHandlers,
    registerLaravelAuthHandlers,
  ];

  for (const registerHandlers of registrars) {
    if (typeof registerHandlers !== "function") {
      throw new TypeError(
        "IPCハンドラーの登録関数がエクスポートされていません。",
      );
    }

    registerHandlers(ipcMain);
  }

  registerDatabaseTypeHandler(ipcMain);
  registerDatabaseSwitchHandler(ipcMain);

  console.log(
    "✅ [handleApiCalls] IPC handlers registered:",
    getDatabaseType(),
  );
}

module.exports = {
  handleApiCalls,
  getDatabaseType,
  normalizeDatabaseType,
};
