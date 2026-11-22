// main/closeConfirmation.js
const { app, dialog } = require("electron");

function registerCloseConfirmation(mainWindow) {
  let shouldClose = false;
  let isShowingDialog = false;

  mainWindow.on("close", async (event) => {
    if (shouldClose || app.isQuittingForUpdate) return;

    event.preventDefault();

    if (isShowingDialog) return;
    isShowingDialog = true;

    try {
      const result = await dialog.showMessageBox(mainWindow, {
        type: "question",
        buttons: ["キャンセル", "終了"],
        defaultId: 0,
        cancelId: 0,
        title: "終了確認",
        message: "終了してもよろしいですか？",
        noLink: true,
      });

      if (result.response === 1) {
        shouldClose = true;
        mainWindow.close();
      }
    } finally {
      isShowingDialog = false;
    }
  });
}

module.exports = {
  registerCloseConfirmation,
};
