const { Menu } = require("electron");

function setAppMenu() {
  // アプリ内の ToolsListNavi にメニューを集約する。
  Menu.setApplicationMenu(null);
}

module.exports = { setAppMenu };
