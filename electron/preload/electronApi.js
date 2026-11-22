// preload/electronApi.js
const { createTableApis } = require("./tableApis");

/**
 * get-database-type の戻り値を吸収する
 *
 * 想定:
 * - "laravel"
 * - { type: "laravel" }
 * - { databaseType: "laravel" }
 */
function normalizeDatabaseType(value) {
  return "laravel";
}

/**
 * 現在のDB種別から IPC prefix を返す
 */
async function getDbPrefix(ipcRenderer) {
  return "laravel";
}

function normalizeServiceRecordStatus(value) {
  if (value === 1 || value === "1" || value === "公開" || value === "公開中") {
    return 1;
  }

  if (value === 2 || value === "2" || value === "下書き") {
    return 2;
  }

  return null;
}

function normalizeServiceRecord(data = {}) {
  return {
    ...data,
    status: normalizeServiceRecordStatus(data?.status),
  };
}

function normalizeServiceRecordsBulk(data = {}) {
  const records = Array.isArray(data?.records) ? data.records : [];
  const saveSyncHistory = [true, 1, "1"].includes(
    data?.save_sync_history,
  );

  return {
    ...data,
    records: records.map(normalizeServiceRecord),
    save_sync_history: saveSyncHistory ? 1 : 0,
    sync_facility_id: saveSyncHistory
      ? Number(data?.sync_facility_id) || null
      : null,
    target_year: saveSyncHistory
      ? Number(data?.target_year) || null
      : null,
    target_month: saveSyncHistory
      ? Number(data?.target_month) || null
      : null,
  };
}

// preloadのエントリーポイントからcreateElectronApiが呼ばれた際に公開する。
let electronWindowExposed = false;

function createElectronApi(ipcRenderer, isDebugMode) {
  const openExternal = (url) =>
    ipcRenderer.invoke("window:open-external", url);

  if (!electronWindowExposed) {
    const { contextBridge } = require("electron");
    contextBridge.exposeInMainWorld("electronWindow", { openExternal });
    electronWindowExposed = true;
  }

  return {
    // window.electronAPI.openExternal からの呼び出しにも対応
    openExternal,
    // ---- デバッグ ----
    isDebugMode: () => isDebugMode,

    // ---- DB 種別 ----
    getDatabaseType: () => ipcRenderer.invoke("get-database-type"),

    // ---- Laravel テーブル一括取得 ----
    laravel_fetchTableAll: (params = {}) => ipcRenderer.invoke("laravel-fetch-table-all", params),

    // 会社・role関連4テーブル（Laravelが認可した範囲のみ、読み取り専用）
    laravel_fetchRoleTables: (params = {}) => ipcRenderer.invoke("laravel-fetch-role-tables", params),

    // ---- Laravel 接続確認 ----
    checkLaravelConnection: () => ipcRenderer.invoke("laravel:connection:check"),

    // ---- Laravel AI文章校正 ----
    laravel_aiRecordEditer_correctPersonalRecord: (data = {}) =>
      ipcRenderer.invoke(
        "laravel:ai-record-editer:personal-record:correct",
        data,
      ),

    laravel_aiRecordEditer_correctProfessionalSupport: (data = {}) =>
      ipcRenderer.invoke(
        "laravel:ai-record-editer:professional-support:correct",
        data,
      ),

    // ---- Web Automation V2 実行 ----
    webAutomationV2_getFlowBundle: (payload = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:flow-bundle:get",
        payload,
      ),

    webAutomationV2_getDraftTestFlowBundle: (payload = {}) =>
      ipcRenderer.invoke("laravel:web-automation-v2:draft-test-bundle:get", payload),

    webAutomationV2_executionLogStart: (payload = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:execution-log:start",
        payload,
      ),

    webAutomationV2_executionLogFinish: (payload = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:execution-log:finish",
        payload,
      ),

    // ---- Web Automation V2 管理 ----
    laravel_webAutomationV2Flows_getAll: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:flows:list",
        params,
      ),

    laravel_webAutomationV2Flow_get: (id, params = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:flow:get",
        id,
        params,
      ),

    laravel_webAutomationV2Flow_update: (id, data = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:flow:update",
        id,
        data,
      ),

    laravel_webAutomationV2ExecutionLogs_getAll: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:execution-logs:list",
        params,
      ),

    laravel_webAutomationV2ExecutionLog_delete: (id) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:execution-log:delete",
        id,
      ),

    // SettingsModal側の互換名
    webAutomationV2_adminFlowsGetAll: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:flows:list",
        params,
      ),

    webAutomationV2_adminFlowGet: (id, params = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:flow:get",
        id,
        params,
      ),

    webAutomationV2_adminFlowUpdate: (id, data = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:flow:update",
        id,
        data,
      ),

    webAutomationV2_adminExecutionLogsGetAll: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:execution-logs:list",
        params,
      ),

    webAutomationV2_adminExecutionLogDelete: (id) =>
      ipcRenderer.invoke(
        "laravel:web-automation-v2:admin:execution-log:delete",
        id,
      ),

    // ---- Q&A・障害対応ナレッジ ----
    laravel_troubleshootingKnowledge_getAll: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:troubleshooting-knowledge:list",
        params,
      ),

    laravel_troubleshootingKnowledge_get: (id) =>
      ipcRenderer.invoke(
        "laravel:troubleshooting-knowledge:get",
        id,
      ),

    laravel_troubleshootingKnowledge_update: (id, data = {}) =>
      ipcRenderer.invoke(
        "laravel:troubleshooting-knowledge:update",
        id,
        data,
      ),

    // ---- 個人記録一括同期履歴 ----
    laravel_personalRecordSync_getMonth: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:personal-record-syncs:get-month",
        params,
      ),

    // snake_caseを使用しているrendererとの互換用。
    laravel_personal_record_syncs_getMonth: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:personal-record-syncs:get-month",
        params,
      ),

    // 既存の取得名との互換用。年月・施設IDをparamsで渡す。
    laravel_personal_record_syncs_getAll: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:personal-record-syncs:get-month",
        params,
      ),

    // ---- Laravel 認証 ----
    /**
     * config.jsonの
     * HUG_USERNAME / HUG_PASSWORDでログインする。
     */
    jwtAutoLogin: () =>
      ipcRenderer.invoke("laravel-auth-login"),

    laravel_auth_login: () =>
      ipcRenderer.invoke("laravel-auth-login"),

    laravel_auth_me: () =>
      ipcRenderer.invoke("laravel-auth-me"),

    laravel_auth_logout: () =>
      ipcRenderer.invoke("laravel-auth-logout"),

    // ---- Laravel managers2 ----
    laravel_procedure_upsertManagers2: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-managers2", data),

    laravel_procedure_registerManagerAssignment: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:register-manager-assignment",
        data,
      ),

    laravel_procedure_call: (procedureName, params = []) =>
      ipcRenderer.invoke(
        "laravel:procedure:call",
        procedureName,
        params,
      ),

    laravel_procedure_registerFacilityChildren: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:register-facility-children",
        data,
      ),

    laravel_procedure_syncHugStaffs: (data) =>
      ipcRenderer.invoke("laravel:procedure:sync-hug-staffs", data),

    laravel_staff_update: (data) =>
      ipcRenderer.invoke("laravel:procedure:update-staff", data),

    laravel_procedure_upsertServiceRecord: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:upsert-service-record",
        normalizeServiceRecord(data),
      ),

    laravel_procedure_upsertServiceRecordsBulk: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:upsert-service-records-bulk",
        normalizeServiceRecordsBulk(data),
      ),

    // ---- Professional Support 月次同期 ----
    laravel_procedure_syncProfessionalSupportMonth: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:sync-professional-support-month",
        data,
      ),

    // ---- Professional Support 月次比較取得 ----
    laravel_procedure_getProfessionalSupportMonth: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:get-professional-support-month",
        data,
      ),

    laravel_procedure_getServiceRecordMonthly: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:get-service-record-monthly",
        data,
      ),

    laravel_procedure_getChildKadaiGraph: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:get-child-kadai-graph",
        data,
      ),

    laravel_procedure_upsertChildKadaiGraph: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:upsert-child-kadai-graph",
        data,
      ),

    laravel_childRecord_delete: (id) =>
      ipcRenderer.invoke("laravel:child-record:delete", id),

    laravel_procedure_getActiveAiPrompt: (data) =>
      ipcRenderer.invoke("laravel:procedure:get-active-ai-prompt", data),

    laravel_procedure_upsertAiPrompt: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-ai-prompt", data),

    laravel_aiRecordEditer_correctPersonalRecordWithPlan: (data = {}) =>
      ipcRenderer.invoke("laravel:ai-record-editer:personal-record:with-plan:correct", data),

    laravel_ai_chat_message: (data) =>
      ipcRenderer.invoke("laravel:ai-chat:message", data),

    laravel_ai_settings: () => ipcRenderer.invoke("laravel:ai:settings"),
    laravel_ai_usageCharts: (params = {}) => ipcRenderer.invoke("laravel:ai:usage-charts", params),

    laravel_ai_chat_checkConnection: (data = {}) =>
      ipcRenderer.invoke("laravel:ai-chat:check-connection", data),

    laravel_healthAnalysis_analyze: (data = {}) =>
      ipcRenderer.invoke("laravel:health-analysis:analyze", data),

    laravel_healthAnalysis_statistics: (data = {}) =>
      ipcRenderer.invoke("laravel:health-analysis:statistics", data),

    laravel_healthAnalysis_abnormalChildren: (data = {}) =>
      ipcRenderer.invoke("laravel:health-analysis:abnormal-children", data),

    laravel_healthAnalysis_logs: (data = {}) =>
      ipcRenderer.invoke("laravel:health-analysis:logs", data),

    laravel_healthAnalysis_logDetail: (logId) =>
      ipcRenderer.invoke("laravel:health-analysis:log-detail", { logId }),

    // ---- テーブル一括同期処理 ----
    // renderer から databaseState を渡さない。
    // ============================================================
    // 一時メモ
    //
    // 以前:
    //
    // 修正後:
    // ============================================================

    saveTempNote: async (data) => {
      const prefix = await getDbPrefix(ipcRenderer);

      if (prefix === "laravel") {
        return ipcRenderer.invoke(
          "laravel:procedure:upsert-temp-notes-all",
          data,
        );
      }

      return ipcRenderer.invoke(`${prefix}:saveTempNote`, data);
    },

    saveTempNote1: async (data) => {
      const prefix = await getDbPrefix(ipcRenderer);

      if (prefix === "laravel") {
        return ipcRenderer.invoke(
          "laravel:procedure:upsert-temp-notes-memo1",
          data,
        );
      }

      return ipcRenderer.invoke(`${prefix}:saveTempNote1`, data);
    },

    saveTempNote2: async (data) => {
      const prefix = await getDbPrefix(ipcRenderer);

      if (prefix === "laravel") {
        return ipcRenderer.invoke(
          "laravel:procedure:upsert-temp-notes-memo2",
          data,
        );
      }

      return ipcRenderer.invoke(`${prefix}:saveTempNote2`, data);
    },

    getTempNote: async ({ children_id, staff_id, day_of_week_id }) => {
      const prefix = await getDbPrefix(ipcRenderer);

      if (prefix === "laravel") {
        return ipcRenderer.invoke("laravel:getTempNote", {
          children_id,
          staff_id,
          day_of_week_id,
        });
      }

      return ipcRenderer.invoke(`${prefix}:getTempNote`, {
        children_id,
        staff_id,
        day_of_week_id,
      });
    },

    // ---- 一時メモ: 明示的に Laravel を呼びたい場合 ----
    laravel_saveTempNote: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-temp-notes-all", data),

    laravel_saveTempNote1: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-temp-notes-memo1", data),

    laravel_saveTempNote2: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-temp-notes-memo2", data),

    laravel_getTempNote: ({ children_id, staff_id, day_of_week_id }) =>
      ipcRenderer.invoke("laravel:getTempNote", {
        children_id,
        staff_id,
        day_of_week_id,
      }),

    // ---- UI / Window ----
    clearWebviewCache: (wcId) =>
      ipcRenderer.invoke("clear-webview-cache", wcId),

    // ---- 印刷プレビュー ----
    openPrintPreview: (data) =>
      ipcRenderer.invoke("open-print-preview", data),

    // ✅ window.confirm() の代わりに使う非ブロッキングな確認ダイアログ
    //    main側で event.sender から呼び出し元ウィンドウを親として表示する
    confirmDialog: (message) =>
      ipcRenderer.invoke("confirm-dialog", message),

    openIndividualSupportPlan: (childId, facilityId) =>
      ipcRenderer.send("open-individual-support-plan", { childId, facilityId }),

    openSpecializedSupportPlan: (childId, facilityId) =>
      ipcRenderer.send("open-specialized-support-plan", { childId, facilityId }),

    Open_NowDayPage: (args) =>
      ipcRenderer.send("Open_NowDayPage", args),

    openWebManagerPage: (args) =>
      ipcRenderer.send("open-web-manager-page", args),

    open_addition_compare_btn: (facility_id, date_str) =>
      ipcRenderer.send("open-addition-compare-btn", {
        facility_id,
        date_str,
      }),

    handleProfessionalSupportSearch: (
      facility_id,
      targetFacility,
      facilitys,
      date_str
    ) =>
      ipcRenderer.send("handle-professional-support-search", {
        facility_id,
        targetFacility,
        facilitys,
        date_str,
      }),

    // ---- 設定 ----
    getAppLockStatus: () => ipcRenderer.invoke("app-lock-status"),
    unlockApp: (passcode) => ipcRenderer.invoke("app-lock-unlock", passcode),
    readConfig: () =>
      ipcRenderer.invoke("read-config"),

    saveConfig: (data) =>
      ipcRenderer.invoke("save-config", data),

    readIni: () =>
      ipcRenderer.invoke("read-ini"),

    saveIni: (data) =>
      ipcRenderer.invoke("save-ini", data),

    resetIni: () =>
      ipcRenderer.invoke("reset-ini"),

    updateIniSetting: (path, value) =>
      ipcRenderer.invoke("update-ini-setting", path, value),

    importConfigFile: () =>
      ipcRenderer.invoke("import-config-file"),

    openConfigFolder: () =>
      ipcRenderer.invoke("open-config-folder"),

    // ---- Update (Laravel API) ----
    getUpdateDebugInfo: () =>
      ipcRenderer.invoke("get-update-debug-info"),

    // renderer側の既存名を維持する。
    checkForUpdates: () =>
      ipcRenderer.invoke("app-update:check"),

    downloadLatestUpdate: () =>
      ipcRenderer.invoke("app-update:download"),

    installDownloadedUpdate: () =>
      ipcRenderer.invoke("app-update:install"),

    onUpdateDownloadProgress: (callback) => {
      if (typeof callback !== "function") {
        return () => {};
      }

      const listener = (_event, progress) => {
        callback(progress);
      };

      ipcRenderer.on(
        "app-update:download-progress",
        listener
      );

      return () => {
        ipcRenderer.removeListener(
          "app-update:download-progress",
          listener
        );
      };
    },

    // ---- Close ----
    onConfirmCloseRequest: (callback) => {
      const listener = () => callback();
      ipcRenderer.on("confirm-close-request", listener);

      return () => {
        ipcRenderer.removeListener("confirm-close-request", listener);
      };
    },

    sendConfirmCloseResponse: (shouldClose) =>
      ipcRenderer.send("confirm-close-response", shouldClose),

    // ---- UI / Window ----
    openInformationWindow: () =>
      ipcRenderer.invoke("open-information-window"),

    openPhpMyAdminWindow: () =>
      ipcRenderer.invoke("open-php-my-admin-window"),

    respondToPhpMyAdminAuth: (response) =>
      ipcRenderer.invoke("respond-php-my-admin-auth", response),

    onPhpMyAdminAuthRequest: (callback) => {
      const listener = (_event, details) => callback(details);
      ipcRenderer.on("php-my-admin-auth-request", listener);

      return () => {
        ipcRenderer.removeListener("php-my-admin-auth-request", listener);
      };
    },

    // ---- webview ----
    getPreloadPath: () =>
      ipcRenderer.invoke("get-preload-path"),

    // ---- Clipboard ----
    copyText: (text) =>
      ipcRenderer.invoke("clipboard:writeText", text),

    // ---- Attendance ----
    saveAttendanceColumnData: (data) => ipcRenderer.invoke("saveAttendanceColumnData", data),

    // ---- Laravel service_record ----
    // Laravel側は登録・更新ともupsertプロシージャを使用する。
    laravel_service_record_insert: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:upsert-service-record",
        normalizeServiceRecord(data),
      ),

    laravel_service_record_upsert: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:upsert-service-record",
        normalizeServiceRecord(data),
      ),

    laravel_service_record_bulk_upsert: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:upsert-service-records-bulk",
        normalizeServiceRecordsBulk(data),
      ),

    laravel_service_record_monthly: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:get-service-record-monthly",
        data,
      ),

    // ---- HUG staffs ----
    syncHugStaffs: (data) =>
      ipcRenderer.invoke("laravel:procedure:sync-hug-staffs", data),

    laravel_hug_staffs_sync: (data) =>
      ipcRenderer.invoke("laravel:procedure:sync-hug-staffs", data),

    // ---- HUG childrens ----
    syncHugChildrens: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:register-facility-children",
        data,
      ),

    laravel_hug_childrens_sync: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:register-facility-children",
        data,
      ),

    // ---- CRUD API 展開 ----
    ...createTableApis(ipcRenderer),

    // 指定施設の課題タイプを専用APIで取得（__all / 汎用CRUDは使用しない）
    laravel_recordTypes_getAll: (params = {}) =>
      ipcRenderer.invoke("laravel:record-types:list", params),
    // 旧テーブルAPI名を使用する呼び出し元向け互換エイリアス
    laravel_record_types_getAll: (params = {}) =>
      ipcRenderer.invoke("laravel:record-types:list", params),
  };
}

module.exports = {
  createElectronApi,
};
