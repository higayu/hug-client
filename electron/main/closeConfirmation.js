// main/closeConfirmation.js
// ウィンドウの閉じる確認を Main プロセスだけで完結させる。
// Renderer のイベントリスナーやWebViewの読み込み状態に依存しない。
const { dialog } = require("electron");

const registeredWindows = new WeakSet();

function registerCloseConfirmation(mainWindow) {
  if (!mainWindow || registeredWindows.has(mainWindow)) return;
  registeredWindows.add(mainWindow);

  mainWindow.on("close", (event) => {
    // OS や Electron による終了済みのウィンドウでは操作しない。
    if (mainWindow.isDestroyed()) return;

    const response = dialog.showMessageBoxSync(mainWindow, {
      type: "question",
      title: "終了の確認",
      message: "アプリを終了しますか？",
      detail: "終了すると、開いているウィンドウが閉じられます。",
      buttons: ["キャンセル", "終了する"],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });

    if (response !== 1) event.preventDefault();
  });
}

module.exports = { registerCloseConfirmation };
