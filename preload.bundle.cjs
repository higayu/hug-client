var __getOwnPropNames = Object.getOwnPropertyNames;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};

// preload/tables.js
var require_tables = __commonJS({
  "preload/tables.js"(exports2, module2) {
    var sharedTables = [
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
      "record_types",
      "child_records",
      "m_service_items",
      "staff_facility_roles",
      "text_data",
      "toolbox",
      "memo"
    ];
    var aiPromptTables = [
      "m_pronpt_items",
      "ai_prompts",
      "ai_prompt_histories"
    ];
    var sqliteTables = [...sharedTables];
    var mariadbTables = [...sharedTables, ...aiPromptTables];
    var laravelTables = [...sharedTables, ...aiPromptTables];
    module2.exports = {
      sqliteTables,
      mariadbTables,
      laravelTables
    };
  }
});

// preload/tableApis.js
var require_tableApis = __commonJS({
  "preload/tableApis.js"(exports2, module2) {
    var {
      sqliteTables,
      mariadbTables,
      laravelTables
    } = require_tables();
    function createTableApis(ipcRenderer2) {
      const tableAPIs = {};
      for (const table of sqliteTables) {
        tableAPIs[`sqlite_${table}_getAll`] = () => ipcRenderer2.invoke(`sqlite:${table}:getAll`);
        tableAPIs[`sqlite_${table}_getById`] = (id) => ipcRenderer2.invoke(`sqlite:${table}:getById`, id);
        tableAPIs[`sqlite_${table}_insert`] = (data) => ipcRenderer2.invoke(`sqlite:${table}:insert`, data);
        tableAPIs[`sqlite_${table}_update`] = (dataOrId, maybeData) => ipcRenderer2.invoke(`sqlite:${table}:update`, dataOrId, maybeData);
        tableAPIs[`sqlite_${table}_delete`] = (...args) => ipcRenderer2.invoke(`sqlite:${table}:delete`, ...args);
        tableAPIs[`sqlite_${table}_upsert`] = (data) => ipcRenderer2.invoke(`sqlite:${table}:upsert`, data);
      }
      for (const table of mariadbTables) {
        tableAPIs[`mariadb_${table}_getAll`] = () => ipcRenderer2.invoke(`mariadb:${table}:getAll`);
        tableAPIs[`mariadb_${table}_getById`] = (id, pk = "id") => ipcRenderer2.invoke(`mariadb:${table}:getByPk`, {
          pk,
          values: id
        });
        tableAPIs[`mariadb_${table}_getByPk`] = ({ pk, values }) => ipcRenderer2.invoke(`mariadb:${table}:getByPk`, {
          pk,
          values
        });
        tableAPIs[`mariadb_${table}_insert`] = (data) => ipcRenderer2.invoke(`mariadb:${table}:insert`, data);
        tableAPIs[`mariadb_${table}_update`] = ({ pk, values, data }) => ipcRenderer2.invoke(`mariadb:${table}:update`, {
          pk,
          values,
          data
        });
        tableAPIs[`mariadb_${table}_delete`] = ({ pk, values }) => ipcRenderer2.invoke(`mariadb:${table}:delete`, {
          pk,
          values
        });
        tableAPIs[`mariadb_${table}_upsert`] = (data) => ipcRenderer2.invoke(`mariadb:${table}:upsert`, data);
      }
      for (const table of laravelTables) {
        tableAPIs[`laravel_${table}_getAll`] = async (params = {}) => {
          const result = await ipcRenderer2.invoke(
            "laravel-fetch-table-all",
            params
          );
          if (result?.success === false) {
            return result;
          }
          const tables = result?.success === true ? result.data : result;
          return Array.isArray(tables?.[table]) ? tables[table] : [];
        };
      }
      tableAPIs.laravel_managers2_delete = (data) => ipcRenderer2.invoke("laravel:managers2:delete", data);
      tableAPIs.laravel_children_update = (data) => ipcRenderer2.invoke("laravel:children:update", data);
      tableAPIs.laravel_temp_notes_getByPk = (data) => ipcRenderer2.invoke("laravel:getTempNote", data);
      return tableAPIs;
    }
    module2.exports = {
      createTableApis
    };
  }
});

// preload/electronApi.js
var require_electronApi = __commonJS({
  "preload/electronApi.js"(exports2, module2) {
    var { createTableApis } = require_tableApis();
    function normalizeDatabaseType(value) {
      if (typeof value === "string") {
        return value;
      }
      if (value && typeof value === "object") {
        return value.type || value.databaseType || value.dbType || "mariadb";
      }
      return "sqlite";
    }
    async function getDbPrefix(ipcRenderer2) {
      const result = await ipcRenderer2.invoke("get-database-type");
      const dbType = normalizeDatabaseType(result);
      if (dbType === "mariadb" || dbType === "laravel") {
        return dbType;
      }
      return "sqlite";
    }
    function createElectronApi2(ipcRenderer2, isDebugMode2) {
      return {
        // ---- デバッグ ----
        isDebugMode: () => isDebugMode2,
        // ---- DB 種別 ----
        getDatabaseType: () => ipcRenderer2.invoke("get-database-type"),
        // ---- MariaDB 接続確認 ----
        checkMariaDbConnection: () => ipcRenderer2.invoke("mariadb:connection:check"),
        // ---- テーブル一括取得 ----
        mariadb_fetchTableAll: () => ipcRenderer2.invoke("mariadb-fetch-table-all"),
        // ---- Laravel テーブル一括取得 ----
        laravel_fetchTableAll: (params = {}) => ipcRenderer2.invoke("laravel-fetch-table-all", params),
        // ---- Laravel 接続確認 ----
        checkLaravelConnection: () => ipcRenderer2.invoke("laravel:connection:check"),
        // ---- Web自動化ルール ----
        /**
         * 有効なWeb自動化ルール一覧を取得する。
         *
         * 例:
         *   await window.electronAPI.laravel_webAutomationRules_getAll()
         *   await window.electronAPI.laravel_webAutomationRules_getAll({
         *     category: "attendance",
         *   })
         */
        laravel_webAutomationRules_getAll: (params = {}) => ipcRenderer2.invoke(
          "laravel:web-automation-rules:list",
          params
        ),
        /**
         * rule_keyを指定して有効なルールを1件取得する。
         *
         * 例:
         *   await window.electronAPI.laravel_webAutomationRule_get(
         *     "attendance_enter"
         *   )
         */
        laravel_webAutomationRule_get: (ruleKey) => ipcRenderer2.invoke(
          "laravel:web-automation-rules:get",
          ruleKey
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
        laravel_admin_update_staff_login: (data) => ipcRenderer2.invoke("laravel:admin:update-staff-login", data),
        laravel_procedure_upsertServiceRecord: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-service-record", data),
        laravel_procedure_getServiceRecordMonthly: (data) => ipcRenderer2.invoke(
          "laravel:procedure:get-service-record-monthly",
          data
        ),
        laravel_procedure_getChildKadaiGraph: (data) => ipcRenderer2.invoke(
          "laravel:procedure:get-child-kadai-graph",
          data
        ),
        laravel_procedure_upsertChildKadaiGraph: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-child-kadai-graph", data),
        laravel_childRecord_delete: (id) => ipcRenderer2.invoke("laravel:child-record:delete", id),
        laravel_procedure_getActiveAiPrompt: (data) => ipcRenderer2.invoke("laravel:procedure:get-active-ai-prompt", data),
        laravel_procedure_upsertAiPrompt: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-ai-prompt", data),
        mariadb_procedure_getActiveAiPrompt: (data) => ipcRenderer2.invoke("mariadb:procedure:get-active-ai-prompt", data),
        mariadb_procedure_upsertAiPrompt: (data) => ipcRenderer2.invoke("mariadb:procedure:upsert-ai-prompt", data),
        sqlite_procedure_getActiveAiPrompt: (data) => ipcRenderer2.invoke("sqlite:procedure:get-active-ai-prompt", data),
        sqlite_procedure_upsertAiPrompt: (data) => ipcRenderer2.invoke("sqlite:procedure:upsert-ai-prompt", data),
        mariadb_procedure_getServiceRecordMonthly: (data) => ipcRenderer2.invoke("mariadb:service_record:get-monthly", data),
        sqlite_getServiceRecordMonthly: (data) => ipcRenderer2.invoke("sqlite:service_record:get-monthly", data),
        // ---- テーブル一括同期処理 ----
        // renderer から databaseState を渡さない。
        // main 側の sqlite:database:sync 内で apiClient.fetchTableAll() を呼び、
        // その戻り値を SQLite に同期する。
        syncDatabaseStateToSqlite: () => ipcRenderer2.invoke("sqlite:database:sync"),
        // ============================================================
        // 一時メモ
        //
        // 以前:
        //   sqlite:saveTempNote 固定
        //
        // 修正後:
        //   DB種別が mariadb なら mariadb:saveTempNote
        //   それ以外なら sqlite:saveTempNote
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
        // ---- 一時メモ: 明示的に SQLite を呼びたい場合 ----
        sqlite_saveTempNote: (data) => ipcRenderer2.invoke("sqlite:saveTempNote", data),
        sqlite_saveTempNote1: (data) => ipcRenderer2.invoke("sqlite:saveTempNote1", data),
        sqlite_saveTempNote2: (data) => ipcRenderer2.invoke("sqlite:saveTempNote2", data),
        sqlite_getTempNote: ({ children_id, staff_id, day_of_week_id }) => ipcRenderer2.invoke("sqlite:getTempNote", {
          children_id,
          staff_id,
          day_of_week_id
        }),
        // ---- 一時メモ: 明示的に MariaDB を呼びたい場合 ----
        mariadb_saveTempNote: (data) => ipcRenderer2.invoke("mariadb:saveTempNote", data),
        mariadb_saveTempNote1: (data) => ipcRenderer2.invoke("mariadb:saveTempNote1", data),
        mariadb_saveTempNote2: (data) => ipcRenderer2.invoke("mariadb:saveTempNote2", data),
        mariadb_getTempNote: ({ children_id, staff_id, day_of_week_id }) => ipcRenderer2.invoke("mariadb:getTempNote", {
          children_id,
          staff_id,
          day_of_week_id
        }),
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
        // ✅ 対策: window.confirm() の代わりに使う非ブロッキングな確認ダイアログ
        //          (renderer側JSスレッドを止めず、常にmainWindowの前面に表示される)
        confirmDialog: (message) => ipcRenderer2.invoke("confirm-dialog", message),
        openIndividualSupportPlan: (childId, facilityId) => ipcRenderer2.send("open-individual-support-plan", { childId, facilityId }),
        openSpecializedSupportPlan: (childId, facilityId) => ipcRenderer2.send("open-specialized-support-plan", { childId, facilityId }),
        Open_NowDayPage: (args) => ipcRenderer2.send("Open_NowDayPage", args),
        openWebManagerPage: (args) => ipcRenderer2.send("open-web-manager-page", args),
        open_addition_compare_btn: (facility_id, date_str) => ipcRenderer2.send("open-addition-compare-btn", {
          facility_id,
          date_str
        }),
        handleProfessionalSupportSearch: (facility_id, targetFacility, date_str) => ipcRenderer2.send("handle-professional-support-search", {
          facility_id,
          targetFacility,
          date_str
        }),
        // ---- 設定 ----
        readConfig: () => ipcRenderer2.invoke("read-config"),
        saveConfig: (data) => ipcRenderer2.invoke("save-config", data),
        readIni: () => ipcRenderer2.invoke("read-ini"),
        saveIni: (data) => ipcRenderer2.invoke("save-ini", data),
        resetIni: () => ipcRenderer2.invoke("reset-ini"),
        updateIniSetting: (path, value) => ipcRenderer2.invoke("update-ini-setting", path, value),
        importConfigFile: () => ipcRenderer2.invoke("import-config-file"),
        openConfigFolder: () => ipcRenderer2.invoke("open-config-folder"),
        // ---- Update ----
        getUpdateDebugInfo: () => ipcRenderer2.invoke("get-update-debug-info"),
        checkForUpdates: () => ipcRenderer2.invoke("check-for-updates"),
        // ---- Close ----
        onConfirmCloseRequest: (callback) => {
          const listener = () => callback();
          ipcRenderer2.on("confirm-close-request", listener);
          return () => {
            ipcRenderer2.removeListener("confirm-close-request", listener);
          };
        },
        sendConfirmCloseResponse: (shouldClose) => ipcRenderer2.send("confirm-close-response", shouldClose),
        // ---- webview ----
        getPreloadPath: () => ipcRenderer2.invoke("get-preload-path"),
        // ---- Clipboard ----
        copyText: (text) => ipcRenderer2.invoke("clipboard:writeText", text),
        // ---- Attendance ----
        saveAttendanceColumnData: (data) => ipcRenderer2.invoke("saveAttendanceColumnData", data),
        // ---- MariaDB service_record ----
        mariadb_service_record_insert: (data) => ipcRenderer2.invoke("mariadb:service_record:insert", data),
        mariadb_service_record_upsert: (data) => ipcRenderer2.invoke("mariadb:service_record:upsert", data),
        // ---- Laravel service_record ----
        // Laravel側は登録・更新ともupsertプロシージャを使用する。
        laravel_service_record_insert: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-service-record", data),
        laravel_service_record_upsert: (data) => ipcRenderer2.invoke("laravel:procedure:upsert-service-record", data),
        laravel_service_record_monthly: (data) => ipcRenderer2.invoke(
          "laravel:procedure:get-service-record-monthly",
          data
        ),
        // ---- HUG staffs ----
        syncHugStaffs: async (data) => {
          const prefix = await getDbPrefix(ipcRenderer2);
          return prefix === "laravel" ? ipcRenderer2.invoke("laravel:procedure:sync-hug-staffs", data) : ipcRenderer2.invoke("mariadb:hug_staffs:sync", data);
        },
        laravel_hug_staffs_sync: (data) => ipcRenderer2.invoke("laravel:procedure:sync-hug-staffs", data),
        // ---- HUG childrens ----
        syncHugChildrens: async (data) => {
          const prefix = await getDbPrefix(ipcRenderer2);
          return prefix === "laravel" ? ipcRenderer2.invoke(
            "laravel:procedure:register-facility-children",
            data
          ) : ipcRenderer2.invoke("mariadb:hug_childrens:sync", data);
        },
        laravel_hug_childrens_sync: (data) => ipcRenderer2.invoke(
          "laravel:procedure:register-facility-children",
          data
        ),
        // ---- CRUD API 展開 ----
        ...createTableApis(ipcRenderer2)
      };
    }
    module2.exports = {
      createElectronApi: createElectronApi2
    };
  }
});

// preload/devApi.js
var require_devApi = __commonJS({
  "preload/devApi.js"(exports2, module2) {
    function createDevApi2(ipcRenderer2) {
      return {
        openDevTools: () => ipcRenderer2.invoke("open-devtools"),
        minimizeWindow: () => ipcRenderer2.invoke("window:minimize"),
        toggleMaximizeWindow: () => ipcRenderer2.invoke("window:toggle-maximize"),
        reloadWindow: () => ipcRenderer2.invoke("window:reload"),
        quitApp: () => ipcRenderer2.invoke("app:quit")
      };
    }
    module2.exports = {
      createDevApi: createDevApi2
    };
  }
});

// preload/whisperApi.js
var require_whisperApi = __commonJS({
  "preload/whisperApi.js"(exports2, module2) {
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

// preload.js
var { contextBridge, ipcRenderer } = require("electron");
console.log("[preload.bundle.cjs] start");
var { createElectronApi } = require_electronApi();
var { createDevApi } = require_devApi();
var { createWhisperApi } = require_whisperApi();
var isDebugMode = process.argv.includes("--dev") || process.argv.includes("--debug");
contextBridge.exposeInMainWorld(
  "electronAPI",
  createElectronApi(ipcRenderer, isDebugMode)
);
contextBridge.exposeInMainWorld(
  "api",
  createDevApi(ipcRenderer)
);
contextBridge.exposeInMainWorld(
  "whisperAPI",
  createWhisperApi(ipcRenderer)
);
