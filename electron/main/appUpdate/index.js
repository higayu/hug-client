// Laravel API アップデート処理の入口。
const { app } = require('electron');
const { UPDATE_CHANNELS, updateState } = require('./state');
const { removeHandlerIfRegistered } = require('./utils');
const { checkForUpdatesHandler } = require('./version');
const { downloadLatestUpdateHandler } = require('./download');
const { installDownloadedUpdateHandler } = require('./install');

function registerAppUpdateHandlers(ipcMain) {
  for (const channel of UPDATE_CHANNELS) removeHandlerIfRegistered(ipcMain, channel);
  ipcMain.handle('get-update-debug-info', async () => ({
    success: true,
    data: { ...updateState, currentVersion: updateState.currentVersion || app.getVersion() },
  }));
  ipcMain.handle('check-for-updates', checkForUpdatesHandler);
  ipcMain.handle('app-update:check', checkForUpdatesHandler);
  ipcMain.handle('app-update:download', downloadLatestUpdateHandler);
  ipcMain.handle('app-update:install', installDownloadedUpdateHandler);
  // 開発用: rendererの更新可否判定に関係なく、最新版を再取得して検証する。
  // パッケージ化済みアプリからは登録されない。
  if (!app.isPackaged) {
    ipcMain.handle('app-update:dev-force-download', downloadLatestUpdateHandler);
  }
  console.log('[AppUpdate] Laravel updater IPC registered:', [
    ...UPDATE_CHANNELS,
    ...(!app.isPackaged ? ['app-update:dev-force-download'] : []),
  ]);
}

module.exports = { registerAppUpdateHandlers };
