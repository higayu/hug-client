// main.js
const { app } = require("electron");

const { createMainWindow } = require("./window");
const { registerIpcHandlers } = require("./ipcHandlers");
const { setAppMenu } = require("./menu");

const { setupMediaPermissions } = require("./permissions");
const { setupAutoUpdater, scheduleUpdateCheck } = require("./updateManager");
const { registerWhisperTranscriber } = require("./whisperTranscriber");
const { registerCloseConfirmation } = require("./closeConfirmation");
const { registerAppLifecycleHandlers } = require("./lifecycle");

// 🔍 調査用: フォーカス/ウィンドウ生成トラッカー（原因調査が終わったら削除する）
//const { attachFocusTracker } = require("./debug/focusTracker.main");

// ✅ 対策: window.confirm() の代わりに使う非ブロッキングな確認ダイアログ
const { registerConfirmDialog } = require("./confirmDialog");

// ============================================================
// 🧹 アプリ終了系イベント
// ============================================================
registerAppLifecycleHandlers();

// ============================================================
// 🏁 Electron 起動処理
// ============================================================
app.whenReady().then(async () => {
  // 🔍 調査用トラッカーを一番最初に起動（以降作られるウィンドウを全部拾うため）
  //attachFocusTracker();

  // メニュー
  setAppMenu();

  // マイク権限
  setupMediaPermissions();

  // アップデーター
  setupAutoUpdater();

  // whisper.cpp 文字起こし IPC
  registerWhisperTranscriber();

  // 5秒後にアップデートチェック
  scheduleUpdateCheck(5000);

  // メインウィンドウ作成
  const mainWindow = createMainWindow();

  // ✅ 対策: 確認ダイアログのIPCを登録（mainWindow作成後、これに紐づける）
  registerConfirmDialog(mainWindow);

  // 既存IPC
  registerIpcHandlers(mainWindow, null);

  // 終了確認
  registerCloseConfirmation(mainWindow);
});
