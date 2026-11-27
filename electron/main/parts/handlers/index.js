const {
  registerLaravelAuthHandlers,
} = require("./laravelAuthHandler");

function normalizeDatabaseType() {
  return "laravel";
}

function getDatabaseType() {
  return "laravel";
}

function removeHandlerIfRegistered(
  ipcMain,
  channel,
) {
  try {
    ipcMain.removeHandler(channel);
  } catch (error) {
    console.warn(
      `[handlers] Failed to remove IPC handler: ${channel}`,
      error,
    );
  }
}

function registerDatabaseTypeHandlers(
  ipcMain,
) {
  removeHandlerIfRegistered(
    ipcMain,
    "get-database-type",
  );

  ipcMain.handle(
    "get-database-type",
    async () => "laravel",
  );

  removeHandlerIfRegistered(
    ipcMain,
    "switch-database-mode",
  );

  ipcMain.handle(
    "switch-database-mode",
    async () => ({
      success: true,
      mode: "laravel",
    }),
  );
}

/**
 * Main起動時にAPI系IPCを同期登録する。
 *
 * registerLaravelAuthHandlers() は ipcMain.handle() を
 * 登録する同期処理なので、不要な await を挟まない。
 * Renderer起動前にLaravel IPC登録を完了させる。
 */
function handleApiCalls(ipcMain) {
  void 0;

  if (
    !ipcMain ||
    typeof ipcMain.handle !== "function"
  ) {
    throw new TypeError(
      "handleApiCalls requires Electron ipcMain.",
    );
  }

  if (
    typeof registerLaravelAuthHandlers !==
    "function"
  ) {
    throw new TypeError(
      "registerLaravelAuthHandlers is not exported.",
    );
  }

  registerLaravelAuthHandlers(ipcMain);
  registerDatabaseTypeHandlers(ipcMain);

  void 0;
}

module.exports = {
  handleApiCalls,
  getDatabaseType,
  normalizeDatabaseType,
};
