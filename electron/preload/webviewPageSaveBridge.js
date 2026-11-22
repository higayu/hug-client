// preload/webviewPageSaveBridge.js
function createWebviewPageSaveBridge(ipcRenderer) {
  return {
    saveCompletePage: (webContentsId) =>
      ipcRenderer.invoke('webview:save-complete-page', webContentsId),
  };
}
module.exports = { createWebviewPageSaveBridge };
