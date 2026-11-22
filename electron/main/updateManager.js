// main/updateManager.js
const { app, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let isAutoUpdaterSetup = false;
let checkPromise = null;

const updateDebugInfo = {
  isChecking: false,
  lastCheckTime: null,
  checkCount: 0,
  lastError: null,
  currentVersion: app.getVersion(),
  updateAvailable: false,
  downloadProgress: 0,
};

global.updateDebugInfo = updateDebugInfo;

function setupAutoUpdater() {
  if (isAutoUpdaterSetup) return;

  isAutoUpdaterSetup = true;

  autoUpdater.logger = log;
  autoUpdater.logger.transports.file.level = "info";

  autoUpdater.on("before-quit-for-update", () => {
    app.isQuittingForUpdate = true;
  });

  autoUpdater.on("checking-for-update", () => {
    updateDebugInfo.isChecking = true;
  });

  autoUpdater.on("update-available", (info) => {
    updateDebugInfo.isChecking = false;
    updateDebugInfo.downloadComplete = false;
    updateDebugInfo.downloadProgress = 0;
    updateDebugInfo.updateAvailable = true;
    updateDebugInfo.newVersion = info.version;
  });

  autoUpdater.on("update-not-available", () => {
    updateDebugInfo.newVersion = null;
    updateDebugInfo.updateAvailable = false;
    updateDebugInfo.isChecking = false;
  });

  autoUpdater.on("error", (err) => {
    updateDebugInfo.lastError = err.message;
    updateDebugInfo.isChecking = false;
  });

  autoUpdater.on("download-progress", (progressObj) => {
    updateDebugInfo.downloadProgress = progressObj.percent;
  });

  autoUpdater.on("update-downloaded", (info) => {
    updateDebugInfo.downloadComplete = true;

    const response = dialog.showMessageBoxSync({
      type: "info",
      title: "アップデート準備完了",
      message: `新しいバージョン ${info.version} がダウンロードされました。今すぐ再起動して更新しますか？`,
      buttons: ["今すぐ再起動", "後で"],
    });

    if (response === 0) {
      autoUpdater.quitAndInstall();
    }
  });
}

function checkForUpdates() {
  setupAutoUpdater();
  if (checkPromise) return checkPromise;
  updateDebugInfo.isChecking = true;
  updateDebugInfo.lastCheckTime = new Date().toISOString();
  updateDebugInfo.checkCount++;
  updateDebugInfo.lastError = null;

  checkPromise = Promise.resolve().then(() => autoUpdater.checkForUpdates())
    .then(result => ({ success: true, data: result }))
    .catch(error => {
      updateDebugInfo.lastError = error.message;
      return { success: false, error: error.message, message: error.message };
    })
    .finally(() => {
      updateDebugInfo.isChecking = false;
      checkPromise = null;
    });
  return checkPromise;
}

function scheduleUpdateCheck(delayMs = 5000) {
  setTimeout(() => { void checkForUpdates(); }, delayMs);
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates,
  scheduleUpdateCheck,
  updateDebugInfo,
};