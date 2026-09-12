// main/parts/handlers/laravelAuthHandler/index.js

const auth = require("./auth");
const tempNotes = require("./tempNotes");
const procedures = require("./procedures");
const updateStaffLogin = require("./admin/updateStaffLogin");
const managers2 = require("./managers2");
const children = require("./children");
const webAutomationRules = require("./webAutomationRules");
const laravelApiClient = require("../../../../src/laravelApiClient");

/**
 * このファイルで登録するIPCチャンネル。
 */
const IPC_CHANNELS = [
  // ============================================================
  // 認証関連
  // ============================================================

  "laravel-auth-login",
  "laravel-auth-me",
  "laravel-auth-logout",
  "laravel:connection:check",

  // ============================================================
  // 全テーブル取得
  // ============================================================

  "laravel-fetch-table-all",

  // ============================================================
  // Web自動化ルール
  // ============================================================

  "laravel:web-automation-rules:list",
  "laravel:web-automation-rules:get",
  "laravel:web-automation-rules:update",

  // ============================================================
  // 一時メモ
  // ============================================================

  "laravel:procedure:upsert-temp-notes-all",
  "laravel:procedure:upsert-temp-notes-memo1",
  "laravel:procedure:upsert-temp-notes-memo2",
  "laravel:getTempNote",

  // ============================================================
  // プロシージャ実行
  // ============================================================

  "laravel:procedure:call",
  "laravel:procedure:register-facility-children",
  "laravel:procedure:register-manager-assignment",
  "laravel:procedure:sync-hug-staffs",
  "laravel:procedure:update-staff",
  "laravel:admin:update-staff-login",
  "laravel:procedure:upsert-service-record",
  "laravel:procedure:get-service-record-monthly",
  "laravel:procedure:get-child-kadai-graph",
  "laravel:procedure:upsert-child-kadai-graph",
  "laravel:child-record:delete",
  "laravel:procedure:get-active-ai-prompt",
  "laravel:procedure:upsert-ai-prompt",
  "laravel:procedure:upsert-managers2",

  "laravel:managers2:delete",  // 追加
  "laravel:children:update",
];

/**
 * 既存IPCハンドラーを解除する。
 *
 * 開発中のホットリロードなどで同じIPCが二重登録されることを防ぐ。
 */
function removeHandlerIfRegistered(
  ipcMain,
  channel
) {
  try {
    ipcMain.removeHandler(channel);
  } catch (error) {
    console.warn(
      `⚠️ [Laravel IPC] ハンドラー解除失敗: ${channel}`,
      error?.message ?? error
    );
  }
}

/**
 * 全テーブル取得ハンドラーを作成する。
 */
function createFetchTableAllHandler(
  fetchAllTables
) {
  return async (
    _event,
    params = {}
  ) => {
    try {
      console.log(
        "🔄 [Laravel API] fetchTableAll START"
      );

      const result =
        await fetchAllTables(params);

      if (result?.success) {
        console.log(
          "✅ [Laravel API] fetchTableAll DONE:",
          {
            tableCount:
              result.meta?.tableCount ??
              0,

            reauthenticated:
              result.meta
                ?.reauthenticated ??
              false,
          }
        );
      } else {
        console.error(
          "❌ [Laravel API] fetchTableAll failed:",
          result
        );
      }

      return result;
    } catch (error) {
      console.error(
        "❌ [Laravel API] fetchTableAll error:",
        error
      );

      return auth.formatError(
        error,
        "全テーブルの取得に失敗しました。"
      );
    }
  };
}

/**
 * Laravel認証・Laravel API関連IPCを登録する。
 */
function registerLaravelAuthHandlers(
  ipcMain
) {
  if (
    !ipcMain ||
    typeof ipcMain.handle !==
      "function"
  ) {
    throw new TypeError(
      "registerLaravelAuthHandlersにはElectronのipcMainを渡してください。"
    );
  }

  /*
   * 開発時の二重登録を防止する。
   */
  for (
    const channel of IPC_CHANNELS
  ) {
    removeHandlerIfRegistered(
      ipcMain,
      channel
    );
  }

  // ============================================================
  // 認証関連
  // ============================================================

  ipcMain.handle(
    "laravel-auth-login",
    auth.loginHandler
  );

  ipcMain.handle(
    "laravel-auth-me",
    auth.meHandler
  );

  ipcMain.handle(
    "laravel-auth-logout",
    auth.logoutHandler
  );

  ipcMain.handle(
    "laravel:connection:check",
    async () => laravelApiClient.checkConnection()
  );

  // ============================================================
  // 全テーブル取得
  // ============================================================

  const fetchTableAllHandler =
    createFetchTableAllHandler(
      auth.fetchAllTables
    );

  ipcMain.handle(
    "laravel-fetch-table-all",
    fetchTableAllHandler
  );

  // ============================================================
  // Web自動化ルール
  // ============================================================

  ipcMain.handle(
    "laravel:web-automation-rules:list",
    webAutomationRules.listHandler
  );

  ipcMain.handle(
    "laravel:web-automation-rules:get",
    webAutomationRules.getHandler
  );

  ipcMain.handle(
    "laravel:web-automation-rules:update",
    webAutomationRules.updateHandler
  );

  // ============================================================
  // 一時メモ関連
  // ============================================================

  ipcMain.handle(
    "laravel:procedure:upsert-temp-notes-all",
    tempNotes.saveAllHandler
  );

  ipcMain.handle(
    "laravel:procedure:upsert-temp-notes-memo1",
    tempNotes.saveMemo1Handler
  );

  ipcMain.handle(
    "laravel:procedure:upsert-temp-notes-memo2",
    tempNotes.saveMemo2Handler
  );

  /*
   * 読み込みは既存のGET APIを使用する。
   */
  ipcMain.handle(
    "laravel:getTempNote",
    tempNotes.getHandler
  );

  // ============================================================
  // プロシージャ実行
  // ============================================================

  /**
   * 汎用プロシージャ呼び出し。
   */
  ipcMain.handle(
    "laravel:procedure:call",
    procedures.callHandler
  );

  /**
   * 児童と施設の一括同期。
   */
  ipcMain.handle(
    "laravel:procedure:register-facility-children",
    procedures
      .registerFacilityChildrenHandler
  );

  /**
   * 児童、施設、担当職員の一括登録。
   *
   * SQL procedure:
   * register_manager_assignment
   */
  ipcMain.handle(
    "laravel:procedure:register-manager-assignment",
    procedures
      .registerManagerAssignmentHandler
  );

  /**
   * 職員情報の同期。
   */
  ipcMain.handle(
    "laravel:procedure:sync-hug-staffs",
    procedures
      .syncHugStaffsHandler
  );

  /**
   * スタッフ情報の更新。
   */
  ipcMain.handle(
    "laravel:procedure:update-staff",
    procedures
      .updateStaffHandler
  );

  ipcMain.handle(
    "laravel:admin:update-staff-login",
    updateStaffLogin.handler
  );

  /**
   * サービス記録の登録・更新。
   */
  ipcMain.handle(
    "laravel:procedure:upsert-service-record",
    procedures
      .upsertServiceRecordHandler
  );

  /**
   * 月次サービス記録の取得。
   */
  ipcMain.handle(
    "laravel:procedure:get-service-record-monthly",
    procedures
      .getServiceRecordMonthlyHandler
  );

  ipcMain.handle(
    "laravel:procedure:get-child-kadai-graph",
    procedures.getChildKadaiGraphHandler
  );

  ipcMain.handle(
    "laravel:procedure:upsert-child-kadai-graph",
    procedures.upsertChildKadaiGraphHandler
  );

  ipcMain.handle(
    "laravel:child-record:delete",
    procedures.deleteChildRecordHandler
  );

  ipcMain.handle(
    "laravel:procedure:get-active-ai-prompt",
    procedures.getActiveAiPromptHandler
  );

  ipcMain.handle(
    "laravel:procedure:upsert-ai-prompt",
    procedures.upsertAiPromptHandler
  );

  /**
   * 既存児童の担当情報を登録・更新。
   */
  ipcMain.handle(
    "laravel:procedure:upsert-managers2",
    procedures
      .upsertManagers2Handler
  );
  /**
   * managers2の担当情報を削除。
   */
  ipcMain.handle(
    "laravel:managers2:delete",
    managers2.deleteHandler
  );

  ipcMain.handle(
    "laravel:children:update",
    children.updateHandler
  );

  console.log(
    "✅ [registerLaravelAuthHandlers] Laravel IPC registered:",
    IPC_CHANNELS
  );
}

module.exports = {
  registerLaravelAuthHandlers,

  /**
   * 旧コードとの互換用。
   */
  handleLaravelAuth:
    registerLaravelAuthHandlers,
};

