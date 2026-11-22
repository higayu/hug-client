// Hug Client updates are distributed through GitHub Releases (package.json build.publish).
const { app } = require('electron');
const { autoUpdater } = require('electron-updater');
const { setupAutoUpdater, checkForUpdates, updateDebugInfo } = require('../updateManager');

function registerAppUpdateHandlers(ipcMain) {
  setupAutoUpdater();
  const handlers = {
    'get-update-debug-info': async () => ({
      success: true,
      data: { ...updateDebugInfo, currentVersion: app.getVersion() },
    }),
    'check-for-updates': checkForUpdates,
    'app-update:check': checkForUpdates,
    'app-update:download': async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { success: true };
      } catch (error) {
        return { success: false, message: error.message };
      }
    },
    'app-update:install': async () => {
      if (!updateDebugInfo.downloadComplete) {
        return { success: false, message: '更新のダウンロードが完了していません。' };
      }
      setImmediate(() => autoUpdater.quitAndInstall());
      return { success: true };
    },
  };
  for (const [channel, handler] of Object.entries(handlers)) {
    ipcMain.removeHandler(channel);
    ipcMain.handle(channel, handler);
  }
}

module.exports = { registerAppUpdateHandlers };
