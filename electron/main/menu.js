const { app, Menu, BrowserWindow } = require("electron");

const template = [
  {
    label: "Your-App",
    submenu: [
      {
        label: "アプリを終了",
        accelerator: process.platform === "darwin" ? "Cmd+Q" : "Ctrl+Q",
        click: () => app.quit(),
      },
    ],
  },
  {
    label: "Window",
    submenu: [
      {
        label: "DeveTool開く",
        accelerator: process.platform === "darwin" ? "Cmd+D" : "Ctrl+D",
         click: () => {
          const win = BrowserWindow.getFocusedWindow();
          if (win) {
            win.webContents.openDevTools();
          }
        },
      },

      {
        label: "最小化",
        accelerator: process.platform === "darwin" ? "Cmd+M" : "Ctrl+M",
        click: () => BrowserWindow.getFocusedWindow()?.minimize(),
      },
      {
        label: "最大化 / 復元",
        accelerator: process.platform === "darwin" ? "Cmd+Ctrl+F" : "F11",
        click: () => {
          const win = BrowserWindow.getFocusedWindow();
          if (!win) return;
          win.isMaximized() ? win.unmaximize() : win.maximize();
        },
      },
      { type: "separator" },
      {
        label: "リロード",
        accelerator: process.platform === "darwin" ? "Cmd+R" : "Ctrl+R",
        click: () => BrowserWindow.getFocusedWindow()?.reload(),
      },
    ],
  },
];

function setAppMenu() {
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

module.exports = { setAppMenu };
