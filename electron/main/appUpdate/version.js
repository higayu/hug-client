const { app } = require('electron');
const laravelApiClient = require('../../../src/laravelApiClient');
const auth = require('../parts/handlers/laravelAuthHandler/auth');
const { updateState } = require('./state');

async function fetchLatestVersionInfo() {
  const currentVersion = app.getVersion();
  const result = await laravelApiClient.get('/app/version', {
    params: { current_version: currentVersion },
  });
  if (result?.success === false) {
    const error = new Error(result?.message || '最新版情報の取得に失敗しました。');
    error.status = result?.status ?? null;
    error.data = result;
    throw error;
  }
  return { ...result, current_version: result?.current_version ?? currentVersion };
}

async function checkForUpdatesHandler() {
  updateState.isChecking = true;
  updateState.checkCount += 1;
  updateState.lastError = null;
  updateState.currentVersion = app.getVersion();
  try {
    const result = await auth.executeAuthenticatedOperation(
      async () => fetchLatestVersionInfo(),
      '最新版の確認に失敗しました。'
    );
    updateState.lastCheckTime = new Date().toISOString();
    if (!result?.success) {
      updateState.lastError = result?.message || '最新版の確認に失敗しました。';
      return result;
    }
    updateState.currentVersion = result.current_version ?? app.getVersion();
    updateState.updateAvailable = Boolean(result.update_available);
    updateState.newVersion = result.latest_version ?? null;
    return result;
  } catch (error) {
    updateState.lastError = error?.message || '最新版の確認に失敗しました。';
    return auth.formatError(error, '最新版の確認に失敗しました。');
  } finally {
    updateState.isChecking = false;
  }
}

module.exports = { fetchLatestVersionInfo, checkForUpdatesHandler };
