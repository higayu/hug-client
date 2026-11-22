// main/webviewPageSaveIpc.js
// Save the requested guest WebView as a complete HTML page.
const { ipcMain, webContents, dialog, BrowserWindow } = require('electron');

const CHANNEL = 'webview:save-complete-page';

function registerWebviewPageSaveIpc() {
  // Follow the same replacement semantics as main/ipcHandlers.js.
  ipcMain.removeHandler(CHANNEL);
  ipcMain.handle(CHANNEL, async (event, guestId) => {
    if (!Number.isSafeInteger(guestId) || guestId <= 0) {
      throw new Error('WebView IDが不正です。');
    }
    const guest = webContents.fromId(guestId);
    if (!guest || guest.isDestroyed() || guest.getType() !== 'webview') {
      throw new Error('保存対象のWebViewが見つかりません。');
    }
    const host = guest.hostWebContents;
    if (!host || host.isDestroyed() || host.id !== event.sender.id) {
      throw new Error('このWebViewへのアクセス権限がありません。');
    }
    const ownerWindow = BrowserWindow.fromWebContents(event.sender);
    if (!ownerWindow || ownerWindow.isDestroyed()) {
      throw new Error('呼び出し元ウィンドウを確認できません。');
    }
    const { canceled, filePath } = await dialog.showSaveDialog(ownerWindow, {
      title: 'WebViewのHTML一式を保存',
      defaultPath: 'webview-page.html',
      filters: [{ name: 'HTML', extensions: ['html'] }],
    });
    if (canceled || !filePath) return { canceled: true };
    // Re-check ownership after the dialog is dismissed.
    if (guest.isDestroyed() || guest.hostWebContents?.id !== event.sender.id) {
      throw new Error('保存対象のWebViewが閉じられました。');
    }
    await guest.savePage(filePath, 'HTMLComplete');
    return { canceled: false, path: filePath };
  });
}

module.exports = { registerWebviewPageSaveIpc };
