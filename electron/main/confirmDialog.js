// main/confirmDialog.js
//
// window.confirm() の代替。
// window.confirm() は renderer の JS スレッドを完全に止めてしまい、
// webview構成のアプリでは「ダイアログがwebviewの裏に隠れる」
// 「押すまで数秒間、他の操作も入力も一切効かなくなる」問題の原因になる。
//
// dialog.showMessageBox は Electron の native ダイアログで、
// - 必ず親ウィンドウ(mainWindow)の前面に表示される
// - 呼び出し側は ipcRenderer.invoke で「非同期」に待てるので
//   結果を待っている間も renderer の JS は止まらない
//
// main.js から下記のように呼び出して登録する:
//
//   const { registerConfirmDialog } = require("./confirmDialog")
//   registerConfirmDialog(mainWindow)

const { ipcMain, dialog } = require("electron")

function registerConfirmDialog(mainWindow) {
  ipcMain.handle("confirm-dialog", async (_event, message) => {
    const result = await dialog.showMessageBox(mainWindow, {
      type: "question",
      buttons: ["はい", "キャンセル"],
      defaultId: 1,
      cancelId: 1,
      message: message ?? "よろしいですか？",
      noLink: true,
    })

    // buttons[0] = "はい" が押された場合のみ true
    return result.response === 0
  })
}

module.exports = { registerConfirmDialog }
