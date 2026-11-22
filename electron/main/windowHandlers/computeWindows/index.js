// main/windowHandlers/computeWindows/index.js
// 加算比較用ウインドウ
const { createDoubleWebviewWindow } = require("./windowManager");

let isRegistered = false;

function open_addition_compare_btn(ipcMain, facility_id, date_str) {
  if (isRegistered) {
    return;
  }
  isRegistered = true;

  // IPCハンドラーを登録
  ipcMain.on("open-addition-compare-btn", (event, args) => {
    const received_facility_id = args?.facility_id || facility_id;
    const received_date_str = args?.date_str || date_str;

    try {
      openDoubleWebviewWithTabs(
        `https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail&f_id=${received_facility_id}&date=${received_date_str}`,
        "https://www.hug-ayumu.link/hug/wm/record_proceedings.php",
        "HUGデータ取得",
        received_facility_id,
        received_date_str
      );
    } catch (error) {
      console.error("❌ [MAIN] ダブルWebViewウィンドウの作成に失敗:", error);
    }
  });

  // デバッグ用：IPCイベントの監視
  const originalOn = ipcMain.on;
  ipcMain.on = function(channel, listener) {
    return originalOn.call(this, channel, listener);
  };
}

function openDoubleWebviewWithTabs(url1, url2, label, facilityId, dateStr) {
  return createDoubleWebviewWindow(
    url1,
    url2,
    label,
    facilityId,
    dateStr
  );
}

module.exports = { open_addition_compare_btn };
