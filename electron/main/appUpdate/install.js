const { app, shell } = require('electron');
const fs = require('fs');
const { updateState, runtime } = require('./state');

async function installDownloadedUpdateHandler() {
  const installerPath = runtime.lastDownloadedInstallerPath || updateState.downloadedFilePath;
  if (!installerPath || !fs.existsSync(installerPath)) {
    return { success: false, message: 'ダウンロード済みのインストーラーが見つかりません。' };
  }
  try {
    const openError = await shell.openPath(installerPath);
    if (openError) throw new Error(openError);
    setTimeout(() => {
      void 0;
      app.quit();
    }, 1000);
    return {
      success: true,
      message: 'インストーラーを起動しました。アプリを終了します。',
      filePath: installerPath,
    };
  } catch (error) {
    updateState.lastError = error?.message || 'インストーラーを起動できませんでした。';
    return { success: false, message: updateState.lastError };
  }
}

module.exports = { installDownloadedUpdateHandler };
