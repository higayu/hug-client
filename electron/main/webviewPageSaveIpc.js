// 指定されたWebViewのページをHTMLComplete形式で保存するIPC
const { ipcMain, webContents, dialog, BrowserWindow } = require("electron");

const CHANNEL = "webview:save-complete-page";

function registerWebviewPageSaveIpc() {
  ipcMain.removeHandler(CHANNEL);
  ipcMain.handle(CHANNEL, async (event, requestedId) => {
    if (!Number.isSafeInteger(requestedId) || requestedId <= 0) {
      throw new Error("有効なWebContents IDを指定してください。");
    }

    const sender = event.sender;
    const target = webContents.fromId(requestedId);
    if (!target || target.isDestroyed() || target.getType() !== "webview") {
      throw new Error("保存対象のWebViewが見つかりません。");
    }
    // 他のウィンドウが保持するWebViewを指定できないようにする
    if (!target.hostWebContents || target.hostWebContents.id !== sender.id) {
      throw new Error("このWebViewを保存する権限がありません。");
    }

    const ownerWindow = BrowserWindow.fromWebContents(sender);
    const options = {
      title: "WebViewをHTMLと関連ファイル一式で保存",
      defaultPath: "webview-page.html",
      filters: [{ name: "HTML", extensions: ["html"] }],
    };
    const result = ownerWindow
      ? await dialog.showSaveDialog(ownerWindow, options)
      : await dialog.showSaveDialog(options);
    if (result.canceled || !result.filePath) return { canceled: true };

    // 保存ダイアログ操作中に対象WebViewが破棄された場合
    if (target.isDestroyed() || target.hostWebContents?.id !== sender.id) {
      throw new Error("保存前に対象WebViewが閉じられました。");
    }
    await target.savePage(result.filePath, "HTMLComplete");
    return { canceled: false, path: result.filePath };
  });
}

module.exports = { registerWebviewPageSaveIpc };
