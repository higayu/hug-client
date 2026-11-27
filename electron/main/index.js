// main.js

const {
  app,
  ipcMain,
} = require("electron");

const {
  createMainWindow,
} = require("./window");

const {
  registerIpcHandlers,
} = require("./ipcHandlers");

const {
  setAppMenu,
} = require("./menu");

const {
  setupMediaPermissions,
} = require("./permissions");

const {
  registerWhisperTranscriber,
} = require("./whisperTranscriber");

const {
  registerCloseConfirmation,
} = require("./closeConfirmation");

const {
  registerAppLifecycleHandlers,
} = require("./lifecycle");

const {
  handleApiCalls,
} = require("./parts/handlers");

const { setupAutoUpdater, scheduleUpdateCheck } = require("./updateManager");

// ✅ 対策: window.confirm() の代わりに使う非ブロッキングな確認ダイアログ
const { registerConfirmDialog } = require("./confirmDialog");

// ============================================================
// アプリ終了系イベント
// ============================================================

registerAppLifecycleHandlers();

// ============================================================
// Electron起動処理
// ============================================================

app.whenReady().then(
  async () => {
    try {
      void 0;

      // ========================================================
      // Laravel API関連IPC登録
      //
      // rendererが起動してAPIを呼び出す前に登録する。
      // laravel-auth-me
      // laravel-auth-login
      // laravel-auth-logout
      // fetchTableAll
      // get-database-type
      // ========================================================

      void 0;

      await handleApiCalls(
        ipcMain,
      );

      void 0;

      // ========================================================
      // メニュー
      // ========================================================

      setAppMenu();

      setupAutoUpdater();
      scheduleUpdateCheck(5000);

      // ========================================================
      // マイク権限
      // ========================================================

      setupMediaPermissions();

      // ========================================================
      // whisper.cpp文字起こしIPC
      // ========================================================

      registerWhisperTranscriber();

      // ========================================================
      // メインウィンドウ作成
      //
      // IPC登録後に作成する。
      // rendererが先にlaravel-auth-meを呼ぶ問題を防止する。
      // ========================================================

      const mainWindow =
        createMainWindow();

      // ========================================================
      // 既存IPC
      // ========================================================

      registerIpcHandlers(
        mainWindow,
        null,
      );

      // ✅ 対策: 確認ダイアログのIPCを登録（mainWindow作成後、これに紐づける）
      registerConfirmDialog(mainWindow);

      // ========================================================
      // 終了確認
      // ========================================================

      registerCloseConfirmation(
        mainWindow,
      );

      void 0;
    } catch (error) {
      console.error(
        "❌ [main] Electron起動処理に失敗しました:",
        error,
      );

      /*
       * IPC登録などの根本的な初期化に失敗した場合は、
       * 不完全な状態でアプリを動かさず終了する。
       */
      app.quit();
    }
  },
);
