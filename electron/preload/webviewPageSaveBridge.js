// Rendererの選択中WebView IDのみをMainへ渡す
function createWebviewPageSaveBridge(ipcRenderer) {
  return {
    saveCompletePage: (webContentsId) =>
      ipcRenderer.invoke("webview:save-complete-page", webContentsId),
  };
}

module.exports = { createWebviewPageSaveBridge };
