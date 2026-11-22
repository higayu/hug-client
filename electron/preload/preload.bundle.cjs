var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// electron/preload/tables.js
var require_tables = __commonJS({
  "electron/preload/tables.js"(exports2, module2) {
    var laravelTables = [
      "children",
      "children_type",
      "day_of_week",
      "facility_children",
      "facility_staff",
      "facilitys",
      "individual_support",
      "managers2",
      "pc",
      "pc_to_children",
      "pronunciation",
      "staffs",
      "service_record",
      "temp_notes",
      "child_records",
      "m_service_items",
      "staff_facility_roles",
      "memo"
    ];
    module2.exports = { laravelTables };
  }
});

// electron/preload/tableApis.js
var require_tableApis = __commonJS({
  "electron/preload/tableApis.js"(exports2, module2) {
    var { laravelTables } = require_tables();
    function createTableApis(ipcRenderer2) {
      const tableApis = {};
      for (const table of laravelTables) {
        tableApis[`laravel_${table}_getAll`] = () => ipcRenderer2.invoke(`laravel:${table}:getAll`);
        tableApis[`laravel_${table}_getById`] = (id, pk = "id") => ipcRenderer2.invoke(`laravel:${table}:getByPk`, { pk, values: id });
        tableApis[`laravel_${table}_getByPk`] = ({ pk, values }) => ipcRenderer2.invoke(`laravel:${table}:getByPk`, { pk, values });
        tableApis[`laravel_${table}_insert`] = (data) => ipcRenderer2.invoke(`laravel:${table}:insert`, data);
        tableApis[`laravel_${table}_update`] = ({ pk, values, data }) => ipcRenderer2.invoke(`laravel:${table}:update`, { pk, values, data });
        tableApis[`laravel_${table}_delete`] = ({ pk, values }) => ipcRenderer2.invoke(`laravel:${table}:delete`, { pk, values });
        tableApis[`laravel_${table}_upsert`] = (data) => ipcRenderer2.invoke(`laravel:${table}:upsert`, data);
      }
      return tableApis;
    }
    module2.exports = { createTableApis };
  }
});

// electron/preload/electronApi.js
var require_electronApi = __commonJS({
  "electron/preload/electronApi.js"(exports2, module2) {
    var { createTableApis } = require_tableApis();
    async function getDbPrefix(ipcRenderer2) {
      return "laravel";
    }
    function normalizeServiceRecordStatus(value) {
      if (value === 1 || value === "1" || value === "\u516C\u958B" || value === "\u516C\u958B\u4E2D") {
        return 1;
      }
      if (value === 2 || value === "2" || value === "\u4E0B\u66F8\u304D") {
        return 2;
      }
      return null;
    }
    function normalizeServiceRecord(data = {}) {
      return {
        ...data,
        status: normalizeServiceRecordStatus(data?.status)
      };
    }
    function normalizeServiceRecordsBulk(data = {}) {
      const records = Array.isArray(data?.records) ? data.records : [];
      const saveSyncHistory = [true, 1, "1"].includes(
        data?.save_sync_history
      );
      return {
        ...data,
        records: records.map(normalizeServiceRecord),
        save_sync_history: saveSyncHistory ? 1 : 0,
        sync_facility_id: saveSyncHistory ? Number(data?.sync_facility_id) || null : null,
        target_year: saveSyncHistory ? Number(data?.target_year) || null : null,
        target_month: saveSyncHistory ? Number(data?.target_month) || null : null
      };
    }
    var electronWindowExposed = false;
    function createElectronApi2(ipcRenderer2, isDebugMode2) {
      const openExternal = (url) => ipcRenderer2.invoke("window:open-external", url);
      if (!electronWindowExposed) {
        const { contextBridge: contextBridge2 } = require("electron");
        contextBridge2.exposeInMainWorld("electronWindow", { openExternal });
        electronWindowExposed = true;
      }
      return {
        // window.electronAPI.openExternal からの呼び出しにも対応
        openExternal,
        // ---- デバッグ ----
        isDebugMode: () => isDebugMode2,
        // ---- DB 種別 ----
        getDatabaseType: () => ipcRenderer2.invoke("get-database-type"),
        // ---- Laravel テーブル一括取得 ----
        laravel_fetchTableAll: (params = {}) => ipcRenderer2.invoke("laravel-fetch-table-all", params),
        // 会社・role関連4テーブル（Laravelが認可した範囲のみ、読み取り専用）
        laravel_fetchRoleTables: (params = {}) => ipcRenderer2.invoke("laravel-fetch-role-tables", params),
        // ---- Laravel 接続確認 ----
        checkLaravelConnection: () => ipcRenderer2.invoke("laravel:connection:check"),
        // ---- Laravel AI文章校正 ----
        laravel_aiRecordEditer_correctPersonalRecord: (data = {}) => ipcRenderer2.invoke(
          "laravel:ai-record-editer:personal-record:correct",
          data
        ),
        laravel_aiRecordEditer_correctProfessionalSupport: (data = {}) => ipcRenderer2.invoke(
          "laravel:ai-record-editer:professional-support:correct",
          data
        ),
        // ---- Web Automation V2 実行 ----
        webAutomationV2_getFlowBundle: (payload = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:flow-bundle:get",
          payload
        ),
        webAutomationV2_getDraftTestFlowBundle: (payload = {}) => ipcRenderer2.invoke("laravel:web-automation-v2:draft-test-bundle:get", payload),
        webAutomationV2_executionLogStart: (payload = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:execution-log:start",
          payload
        ),
        webAutomationV2_executionLogFinish: (payload = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:execution-log:finish",
          payload
        ),
        // ---- Web Automation V2 管理 ----
        laravel_webAutomationV2Flows_getAll: (params = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:flows:list",
          params
        ),
        laravel_webAutomationV2Flow_get: (id, params = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:flow:get",
          id,
          params
        ),
        laravel_webAutomationV2Flow_update: (id, data = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:flow:update",
          id,
          data
        ),
        laravel_webAutomationV2ExecutionLogs_getAll: (params = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:execution-logs:list",
          params
        ),
        laravel_webAutomationV2ExecutionLog_delete: (id) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:execution-log:delete",
          id
        ),
        // SettingsModal側の互換名
        webAutomationV2_adminFlowsGetAll: (params = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:flows:list",
          params
        ),
        webAutomationV2_adminFlowGet: (id, params = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:flow:get",
          id,
          params
        ),
        webAutomationV2_adminFlowUpdate: (id, data = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:flow:update",
          id,
          data
        ),
        webAutomationV2_adminExecutionLogsGetAll: (params = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:execution-logs:list",
          params
        ),
        webAutomationV2_adminExecutionLogDelete: (id) => ipcRenderer2.invoke(
          "laravel:web-automation-v2:admin:execution-log:delete",
          id
        ),
        // ---- Q&A・障害対応ナレッジ ----
        laravel_troubleshootingKnowledge_getAll: (params = {}) => ipcRenderer2.invoke(
          "laravel:troubleshooting-knowledge:list",
          params
        ),
        laravel_troubleshootingKnowledge_get: (id) => ipcRenderer2.invoke(
          "laravel:troubleshooting-knowledge:get",
          id
        ),
        laravel_troubleshootingKnowledge_update: (id, data = {}) => ipcRenderer2.invoke(
          "laravel:troubleshooting-knowledge:update",
          id,
          data
        ),
        // ---- 個人記録一括同期履歴 ----
        laravel_personalRecordSync_getMonth: (params = {}) => ipcRenderer2.invoke(
          "laravel:personal-record-syncs:get-month",
          params
        ),
        // snake_caseを使用しているrendererとの互換用。
        laravel_personal_record_syncs_getMonth: (params = {}) => ipcRenderer2.invoke(
          "laravel:personal-record-syncs:get-month",
          params
        ),
        // 既存の取得名との互換用。年月・施設IDをparamsで渡す。
        laravel_personal_record_syncs_getAll: (params = {}) => ipcRenderer2.invoke(
          "laravel:personal-record-syncs:get-month",
          params
        ),
        // ---- Laravel 認証 ----
        /**
         * config.jsonの
         * HUG_USERNAME / HUG_PASSWORDでログインする。
         */
        jwtAutoLogin: () => ipcRenderer2.invoke("laravel-auth-login"),
        laravel_auth_login: () => ipcRenderer2.invoke("laravel-auth-login"),
        laravel_auth_me: () => ipcRenderer2.invoke("laravel-auth-me"),
        laravel_auth_logout: () => ipcRenderer2.invoke("laravel-auth-logout"),
        // ---- Laravel managers2 ----
        laravel_procedure_upsertManagers2: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-managers2", data),
        laravel_procedure_registerManagerAssignment: (data) => ipcRenderer2.invoke(
          "laravel:procedure:register-manager-assignment",
          data
        ),
        laravel_procedure_call: (procedureName, params = []) => ipcRenderer2.invoke(
          "laravel:procedure:call",
          procedureName,
          params
        ),
        laravel_procedure_registerFacilityChildren: (data) => ipcRenderer2.invoke(
          "laravel:procedure:register-facility-children",
          data
        ),
        laravel_procedure_syncHugStaffs: (data) => ipcRenderer2.invoke("laravel:procedure:sync-hug-staffs", data),
        laravel_staff_update: (data) => ipcRenderer2.invoke("laravel:procedure:update-staff", data),
        laravel_procedure_upsertServiceRecord: (data) => ipcRenderer2.invoke(
          "laravel:procedure:upsert-service-record",
          normalizeServiceRecord(data)
        ),
        laravel_procedure_upsertServiceRecordsBulk: (data) => ipcRenderer2.invoke(
          "laravel:procedure:upsert-service-records-bulk",
          normalizeServiceRecordsBulk(data)
        ),
        // ---- Professional Support 月次同期 ----
        laravel_procedure_syncProfessionalSupportMonth: (data) => ipcRenderer2.invoke(
          "laravel:procedure:sync-professional-support-month",
          data
        ),
        // ---- Professional Support 月次比較取得 ----
        laravel_procedure_getProfessionalSupportMonth: (data) => ipcRenderer2.invoke(
          "laravel:procedure:get-professional-support-month",
          data
        ),
        laravel_procedure_getServiceRecordMonthly: (data) => ipcRenderer2.invoke(
          "laravel:procedure:get-service-record-monthly",
          data
        ),
        laravel_procedure_getChildKadaiGraph: (data) => ipcRenderer2.invoke(
          "laravel:procedure:get-child-kadai-graph",
          data
        ),
        laravel_procedure_upsertChildKadaiGraph: (data) => ipcRenderer2.invoke(
          "laravel:procedure:upsert-child-kadai-graph",
          data
        ),
        laravel_childRecord_delete: (id) => ipcRenderer2.invoke("laravel:child-record:delete", id),
        laravel_procedure_getActiveAiPrompt: (data) => ipcRenderer2.invoke("laravel:procedure:get-active-ai-prompt", data),
        laravel_procedure_upsertAiPrompt: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-ai-prompt", data),
        laravel_aiRecordEditer_correctPersonalRecordWithPlan: (data = {}) => ipcRenderer2.invoke("laravel:ai-record-editer:personal-record:with-plan:correct", data),
        laravel_ai_chat_message: (data) => ipcRenderer2.invoke("laravel:ai-chat:message", data),
        laravel_ai_settings: () => ipcRenderer2.invoke("laravel:ai:settings"),
        laravel_ai_usageCharts: (params = {}) => ipcRenderer2.invoke("laravel:ai:usage-charts", params),
        laravel_ai_chat_checkConnection: (data = {}) => ipcRenderer2.invoke("laravel:ai-chat:check-connection", data),
        laravel_healthAnalysis_analyze: (data = {}) => ipcRenderer2.invoke("laravel:health-analysis:analyze", data),
        laravel_healthAnalysis_statistics: (data = {}) => ipcRenderer2.invoke("laravel:health-analysis:statistics", data),
        laravel_healthAnalysis_abnormalChildren: (data = {}) => ipcRenderer2.invoke("laravel:health-analysis:abnormal-children", data),
        laravel_healthAnalysis_logs: (data = {}) => ipcRenderer2.invoke("laravel:health-analysis:logs", data),
        laravel_healthAnalysis_logDetail: (logId) => ipcRenderer2.invoke("laravel:health-analysis:log-detail", { logId }),
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
          const prefix = await getDbPrefix(ipcRenderer2);
          if (prefix === "laravel") {
            return ipcRenderer2.invoke(
              "laravel:procedure:upsert-temp-notes-all",
              data
            );
          }
          return ipcRenderer2.invoke(`${prefix}:saveTempNote`, data);
        },
        saveTempNote1: async (data) => {
          const prefix = await getDbPrefix(ipcRenderer2);
          if (prefix === "laravel") {
            return ipcRenderer2.invoke(
              "laravel:procedure:upsert-temp-notes-memo1",
              data
            );
          }
          return ipcRenderer2.invoke(`${prefix}:saveTempNote1`, data);
        },
        saveTempNote2: async (data) => {
          const prefix = await getDbPrefix(ipcRenderer2);
          if (prefix === "laravel") {
            return ipcRenderer2.invoke(
              "laravel:procedure:upsert-temp-notes-memo2",
              data
            );
          }
          return ipcRenderer2.invoke(`${prefix}:saveTempNote2`, data);
        },
        getTempNote: async ({ children_id, staff_id, day_of_week_id }) => {
          const prefix = await getDbPrefix(ipcRenderer2);
          if (prefix === "laravel") {
            return ipcRenderer2.invoke("laravel:getTempNote", {
              children_id,
              staff_id,
              day_of_week_id
            });
          }
          return ipcRenderer2.invoke(`${prefix}:getTempNote`, {
            children_id,
            staff_id,
            day_of_week_id
          });
        },
        // ---- 一時メモ: 明示的に Laravel を呼びたい場合 ----
        laravel_saveTempNote: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-temp-notes-all", data),
        laravel_saveTempNote1: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-temp-notes-memo1", data),
        laravel_saveTempNote2: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-temp-notes-memo2", data),
        laravel_getTempNote: ({ children_id, staff_id, day_of_week_id }) => ipcRenderer2.invoke("laravel:getTempNote", {
          children_id,
          staff_id,
          day_of_week_id
        }),
        // ---- UI / Window ----
        clearWebviewCache: (wcId) => ipcRenderer2.invoke("clear-webview-cache", wcId),
        // ---- 印刷プレビュー ----
        openPrintPreview: (data) => ipcRenderer2.invoke("open-print-preview", data),
        // ✅ window.confirm() の代わりに使う非ブロッキングな確認ダイアログ
        //    main側で event.sender から呼び出し元ウィンドウを親として表示する
        confirmDialog: (message) => ipcRenderer2.invoke("confirm-dialog", message),
        openIndividualSupportPlan: (childId, facilityId) => ipcRenderer2.send("open-individual-support-plan", { childId, facilityId }),
        openSpecializedSupportPlan: (childId, facilityId) => ipcRenderer2.send("open-specialized-support-plan", { childId, facilityId }),
        Open_NowDayPage: (args) => ipcRenderer2.send("Open_NowDayPage", args),
        openWebManagerPage: (args) => ipcRenderer2.send("open-web-manager-page", args),
        open_addition_compare_btn: (facility_id, date_str) => ipcRenderer2.send("open-addition-compare-btn", {
          facility_id,
          date_str
        }),
        handleProfessionalSupportSearch: (facility_id, targetFacility, facilitys, date_str) => ipcRenderer2.send("handle-professional-support-search", {
          facility_id,
          targetFacility,
          facilitys,
          date_str
        }),
        // ---- 設定 ----
        getAppLockStatus: () => ipcRenderer2.invoke("app-lock-status"),
        unlockApp: (passcode) => ipcRenderer2.invoke("app-lock-unlock", passcode),
        readConfig: () => ipcRenderer2.invoke("read-config"),
        saveConfig: (data) => ipcRenderer2.invoke("save-config", data),
        readIni: () => ipcRenderer2.invoke("read-ini"),
        saveIni: (data) => ipcRenderer2.invoke("save-ini", data),
        resetIni: () => ipcRenderer2.invoke("reset-ini"),
        updateIniSetting: (path, value) => ipcRenderer2.invoke("update-ini-setting", path, value),
        importConfigFile: () => ipcRenderer2.invoke("import-config-file"),
        openConfigFolder: () => ipcRenderer2.invoke("open-config-folder"),
        // ---- Update (Laravel API) ----
        getUpdateDebugInfo: () => ipcRenderer2.invoke("get-update-debug-info"),
        // renderer側の既存名を維持する。
        checkForUpdates: () => ipcRenderer2.invoke("app-update:check"),
        downloadLatestUpdate: () => ipcRenderer2.invoke("app-update:download"),
        installDownloadedUpdate: () => ipcRenderer2.invoke("app-update:install"),
        onUpdateDownloadProgress: (callback) => {
          if (typeof callback !== "function") {
            return () => {
            };
          }
          const listener = (_event, progress) => {
            callback(progress);
          };
          ipcRenderer2.on(
            "app-update:download-progress",
            listener
          );
          return () => {
            ipcRenderer2.removeListener(
              "app-update:download-progress",
              listener
            );
          };
        },
        // ---- Close ----
        onConfirmCloseRequest: (callback) => {
          const listener = () => callback();
          ipcRenderer2.on("confirm-close-request", listener);
          return () => {
            ipcRenderer2.removeListener("confirm-close-request", listener);
          };
        },
        sendConfirmCloseResponse: (shouldClose) => ipcRenderer2.send("confirm-close-response", shouldClose),
        // ---- UI / Window ----
        openInformationWindow: () => ipcRenderer2.invoke("open-information-window"),
        openPhpMyAdminWindow: () => ipcRenderer2.invoke("open-php-my-admin-window"),
        respondToPhpMyAdminAuth: (response) => ipcRenderer2.invoke("respond-php-my-admin-auth", response),
        onPhpMyAdminAuthRequest: (callback) => {
          const listener = (_event, details) => callback(details);
          ipcRenderer2.on("php-my-admin-auth-request", listener);
          return () => {
            ipcRenderer2.removeListener("php-my-admin-auth-request", listener);
          };
        },
        // ---- webview ----
        getPreloadPath: () => ipcRenderer2.invoke("get-preload-path"),
        // ---- Clipboard ----
        copyText: (text) => ipcRenderer2.invoke("clipboard:writeText", text),
        // ---- Attendance ----
        saveAttendanceColumnData: (data) => ipcRenderer2.invoke("saveAttendanceColumnData", data),
        // ---- Laravel service_record ----
        // Laravel側は登録・更新ともupsertプロシージャを使用する。
        laravel_service_record_insert: (data) => ipcRenderer2.invoke(
          "laravel:procedure:upsert-service-record",
          normalizeServiceRecord(data)
        ),
        laravel_service_record_upsert: (data) => ipcRenderer2.invoke(
          "laravel:procedure:upsert-service-record",
          normalizeServiceRecord(data)
        ),
        laravel_service_record_bulk_upsert: (data) => ipcRenderer2.invoke(
          "laravel:procedure:upsert-service-records-bulk",
          normalizeServiceRecordsBulk(data)
        ),
        laravel_service_record_monthly: (data) => ipcRenderer2.invoke(
          "laravel:procedure:get-service-record-monthly",
          data
        ),
        // ---- HUG staffs ----
        syncHugStaffs: (data) => ipcRenderer2.invoke("laravel:procedure:sync-hug-staffs", data),
        laravel_hug_staffs_sync: (data) => ipcRenderer2.invoke("laravel:procedure:sync-hug-staffs", data),
        // ---- HUG childrens ----
        syncHugChildrens: (data) => ipcRenderer2.invoke(
          "laravel:procedure:register-facility-children",
          data
        ),
        laravel_hug_childrens_sync: (data) => ipcRenderer2.invoke(
          "laravel:procedure:register-facility-children",
          data
        ),
        // ---- CRUD API 展開 ----
        ...createTableApis(ipcRenderer2),
        // 指定施設の課題タイプを専用APIで取得（__all / 汎用CRUDは使用しない）
        laravel_recordTypes_getAll: (params = {}) => ipcRenderer2.invoke("laravel:record-types:list", params),
        // 旧テーブルAPI名を使用する呼び出し元向け互換エイリアス
        laravel_record_types_getAll: (params = {}) => ipcRenderer2.invoke("laravel:record-types:list", params)
      };
    }
    module2.exports = {
      createElectronApi: createElectronApi2
    };
  }
});

// electron/preload/devApi.js
var require_devApi = __commonJS({
  "electron/preload/devApi.js"(exports2, module2) {
    function createDevApi2(ipcRenderer2, isDebugMode2 = false) {
      return {
        openDevTools: () => ipcRenderer2.invoke("open-devtools"),
        minimizeWindow: () => ipcRenderer2.invoke("window:minimize"),
        toggleMaximizeWindow: () => ipcRenderer2.invoke("window:toggle-maximize"),
        reloadWindow: () => ipcRenderer2.invoke("window:reload"),
        quitApp: () => ipcRenderer2.invoke("app:quit"),
        // 開発環境限定: Laravelの最新版を強制ダウンロードしSHA-256を検証
        // この公開関数自体は常時存在させる。実行許可はMainの app.isPackaged で制御。
        forceDownloadLatestUpdateForDebug: () => ipcRenderer2.invoke("app-update:dev-force-download")
      };
    }
    module2.exports = {
      createDevApi: createDevApi2
    };
  }
});

// electron/preload/whisperApi.js
var require_whisperApi = __commonJS({
  "electron/preload/whisperApi.js"(exports2, module2) {
    function createWhisperApi2(ipcRenderer2) {
      return {
        transcribe: async (audioArrayBuffer, options = {}) => {
          return await ipcRenderer2.invoke(
            "whisper:transcribe",
            audioArrayBuffer,
            options
          );
        }
      };
    }
    module2.exports = {
      createWhisperApi: createWhisperApi2
    };
  }
});

// electron/preload/webviewPageSaveBridge.js
var require_webviewPageSaveBridge = __commonJS({
  "electron/preload/webviewPageSaveBridge.js"(exports2, module2) {
    function createWebviewPageSaveBridge2(ipcRenderer2) {
      return {
        saveCompletePage: (webContentsId) => ipcRenderer2.invoke("webview:save-complete-page", webContentsId)
      };
    }
    module2.exports = { createWebviewPageSaveBridge: createWebviewPageSaveBridge2 };
  }
});

// electron/preload/index.js
var { contextBridge, ipcRenderer } = require("electron");
console.log("[preload.bundle.cjs] start");
var { createElectronApi } = require_electronApi();
var { createDevApi } = require_devApi();
var { createWhisperApi } = require_whisperApi();
var { createWebviewPageSaveBridge } = require_webviewPageSaveBridge();
var isDebugMode = process.argv.includes("--dev") || process.argv.includes("--debug");
contextBridge.exposeInMainWorld(
  "electronAPI",
  createElectronApi(ipcRenderer, isDebugMode)
);
contextBridge.exposeInMainWorld(
  "api",
  createDevApi(ipcRenderer, isDebugMode)
);
contextBridge.exposeInMainWorld(
  "whisperAPI",
  createWhisperApi(ipcRenderer)
);
contextBridge.exposeInMainWorld(
  "electronWebviewPageSave",
  createWebviewPageSaveBridge(ipcRenderer)
);
