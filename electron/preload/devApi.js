// preload/devApi.js
function createDevApi(ipcRenderer, isDebugMode = false) {
  return {
    openDevTools: () =>
      ipcRenderer.invoke("open-devtools"),

    minimizeWindow: () =>
      ipcRenderer.invoke("window:minimize"),

    toggleMaximizeWindow: () =>
      ipcRenderer.invoke("window:toggle-maximize"),

    reloadWindow: () =>
      ipcRenderer.invoke("window:reload"),

    quitApp: () =>
      ipcRenderer.invoke("app:quit"),

    // 開発環境限定: Laravelの最新版を強制ダウンロードしSHA-256を検証
    // この公開関数自体は常時存在させる。実行許可はMainの app.isPackaged で制御。
    forceDownloadLatestUpdateForDebug: () =>
      ipcRenderer.invoke("app-update:dev-force-download"),
  };
}

module.exports = {
  createDevApi,
};
