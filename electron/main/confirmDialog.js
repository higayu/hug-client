// main/confirmDialog.js
//
// renderer から呼び出された確認ダイアログを、
// 常に「呼び出し元の BrowserWindow」を親として表示する。
// MainWindow / ProfessionalSupportWindow など複数ウィンドウで共通利用可能。

const { ipcMain, dialog, BrowserWindow } = require("electron")

function registerConfirmDialog(mainWindow) {
  ipcMain.handle("confirm-dialog", async (event, message) => {
    // invoke してきた renderer を所有するウィンドウを優先する。
    // 取得できないケースだけ MainWindow をフォールバックとして使う。
    const senderWindow = BrowserWindow.fromWebContents(event.sender)
    const parentWindow =
      senderWindow && !senderWindow.isDestroyed()
        ? senderWindow
        : mainWindow && !mainWindow.isDestroyed()
          ? mainWindow
          : undefined

    const options = {
      type: "question",
      buttons: ["はい", "キャンセル"],
      defaultId: 1,
      cancelId: 1,
      message: message ?? "よろしいですか？",
      noLink: true,
    }

    const result = parentWindow
      ? await dialog.showMessageBox(parentWindow, options)
      : await dialog.showMessageBox(options)

    return result.response === 0
  })
}

module.exports = { registerConfirmDialog }
