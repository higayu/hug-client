const UPDATE_CHANNELS = [
  'get-update-debug-info',
  'check-for-updates',
  'app-update:check',
  'app-update:download',
  'app-update:install',
];

const updateState = {
  isChecking: false,
  lastCheckTime: null,
  checkCount: 0,
  lastError: null,
  currentVersion: null,
  updateAvailable: false,
  newVersion: null,
  downloadProgress: 0,
  downloadedFilePath: null,
};

const runtime = { downloadInProgress: false, lastDownloadedInstallerPath: null };
module.exports = { UPDATE_CHANNELS, updateState, runtime };
