// main/updateManager.js
const { app, dialog } = require("electron");
const { autoUpdater } = require("electron-updater");
const log = require("electron-log");

let isAutoUpdaterSetup = false;

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

  autoUpdater.on("checking-for-update", () => {
    updateDebugInfo.isChecking = true;
  });

  autoUpdater.on("update-available", (info) => {
    updateDebugInfo.updateAvailable = true;
    updateDebugInfo.newVersion = info.version;
  });

  autoUpdater.on("update-not-available", () => {
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

function scheduleUpdateCheck(delayMs = 5000) {
  setTimeout(() => {
    try {
      updateDebugInfo.isChecking = true;
      updateDebugInfo.lastCheckTime = new Date().toISOString();
      updateDebugInfo.checkCount++;

      autoUpdater.checkForUpdatesAndNotify();
    } catch (err) {
      updateDebugInfo.lastError = err.message;
      updateDebugInfo.isChecking = false;
    }
  }, delayMs);
}

module.exports = {
  setupAutoUpdater,
  scheduleUpdateCheck,
  updateDebugInfo,
};