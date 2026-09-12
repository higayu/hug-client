// preload/electronApi.js
const { createTableApis } = require("./tableApis");

/**
 * get-database-type の戻り値を吸収する
 *
 * 想定:
 * - "sqlite"
 * - "mariadb"
 * - "laravel"
 * - { type: "sqlite" }
 * - { type: "mariadb" }
 * - { type: "laravel" }
 * - { databaseType: "sqlite" }
 * - { databaseType: "mariadb" }
 * - { databaseType: "laravel" }
 */
function normalizeDatabaseType(value) {
  if (typeof value === "string") {
    return value;
  }

  if (value && typeof value === "object") {
    return value.type || value.databaseType || value.dbType || "mariadb";
  }

  return "sqlite";
}

/**
 * 現在のDB種別から IPC prefix を返す
 */
async function getDbPrefix(ipcRenderer) {
  const result = await ipcRenderer.invoke("get-database-type");
  const dbType = normalizeDatabaseType(result);

  if (dbType === "mariadb" || dbType === "laravel") {
    return dbType;
  }

  return "sqlite";
}

function createElectronApi(ipcRenderer, isDebugMode) {
  return {
    // ---- デバッグ ----
    isDebugMode: () => isDebugMode,

    // ---- DB 種別 ----
    getDatabaseType: () => ipcRenderer.invoke("get-database-type"),

    // ---- MariaDB 接続確認 ----
    checkMariaDbConnection: () =>
      ipcRenderer.invoke("mariadb:connection:check"),

    // ---- テーブル一括取得 ----
    mariadb_fetchTableAll: () =>
      ipcRenderer.invoke("mariadb-fetch-table-all"),

    // ---- Laravel テーブル一括取得 ----
    laravel_fetchTableAll: (params = {}) =>
      ipcRenderer.invoke("laravel-fetch-table-all", params),

    // ---- Laravel 接続確認 ----
    checkLaravelConnection: () =>
      ipcRenderer.invoke("laravel:connection:check"),

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
    laravel_webAutomationRules_getAll: (params = {}) =>
      ipcRenderer.invoke(
        "laravel:web-automation-rules:list",
        params,
      ),

    /**
     * rule_keyを指定して有効なルールを1件取得する。
     *
     * 例:
     *   await window.electronAPI.laravel_webAutomationRule_get(
     *     "attendance_enter"
     *   )
     */
    laravel_webAutomationRule_get: (ruleKey) =>
      ipcRenderer.invoke(
        "laravel:web-automation-rules:get",
        ruleKey,
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

    laravel_admin_update_staff_login: (data) =>
      ipcRenderer.invoke("laravel:admin:update-staff-login", data),
    
    laravel_procedure_upsertServiceRecord: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-service-record", data),

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
      ipcRenderer.invoke("laravel:procedure:upsert-child-kadai-graph", data),

    laravel_childRecord_delete: (id) =>
      ipcRenderer.invoke("laravel:child-record:delete", id),

    laravel_procedure_getActiveAiPrompt: (data) =>
      ipcRenderer.invoke("laravel:procedure:get-active-ai-prompt", data),

    laravel_procedure_upsertAiPrompt: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-ai-prompt", data),

    mariadb_procedure_getActiveAiPrompt: (data) =>
      ipcRenderer.invoke("mariadb:procedure:get-active-ai-prompt", data),

    mariadb_procedure_upsertAiPrompt: (data) =>
      ipcRenderer.invoke("mariadb:procedure:upsert-ai-prompt", data),

    sqlite_procedure_getActiveAiPrompt: (data) =>
      ipcRenderer.invoke("sqlite:procedure:get-active-ai-prompt", data),

    sqlite_procedure_upsertAiPrompt: (data) =>
      ipcRenderer.invoke("sqlite:procedure:upsert-ai-prompt", data),

    mariadb_procedure_getServiceRecordMonthly: (data) =>
      ipcRenderer.invoke("mariadb:service_record:get-monthly", data),

    sqlite_getServiceRecordMonthly: (data) =>
      ipcRenderer.invoke("sqlite:service_record:get-monthly", data),

    // ---- テーブル一括同期処理 ----
    // renderer から databaseState を渡さない。
    // main 側の sqlite:database:sync 内で apiClient.fetchTableAll() を呼び、
    // その戻り値を SQLite に同期する。
    syncDatabaseStateToSqlite: () =>
      ipcRenderer.invoke("sqlite:database:sync"),

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

    // ---- 一時メモ: 明示的に SQLite を呼びたい場合 ----
    sqlite_saveTempNote: (data) =>
      ipcRenderer.invoke("sqlite:saveTempNote", data),

    sqlite_saveTempNote1: (data) =>
      ipcRenderer.invoke("sqlite:saveTempNote1", data),

    sqlite_saveTempNote2: (data) =>
      ipcRenderer.invoke("sqlite:saveTempNote2", data),

    sqlite_getTempNote: ({ children_id, staff_id, day_of_week_id }) =>
      ipcRenderer.invoke("sqlite:getTempNote", {
        children_id,
        staff_id,
        day_of_week_id,
      }),

    // ---- 一時メモ: 明示的に MariaDB を呼びたい場合 ----
    mariadb_saveTempNote: (data) =>
      ipcRenderer.invoke("mariadb:saveTempNote", data),

    mariadb_saveTempNote1: (data) =>
      ipcRenderer.invoke("mariadb:saveTempNote1", data),

    mariadb_saveTempNote2: (data) =>
      ipcRenderer.invoke("mariadb:saveTempNote2", data),

    mariadb_getTempNote: ({ children_id, staff_id, day_of_week_id }) =>
      ipcRenderer.invoke("mariadb:getTempNote", {
        children_id,
        staff_id,
        day_of_week_id,
      }),

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

    // ✅ 対策: window.confirm() の代わりに使う非ブロッキングな確認ダイアログ
    //          (renderer側JSスレッドを止めず、常にmainWindowの前面に表示される)
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
      date_str
    ) =>
      ipcRenderer.send("handle-professional-support-search", {
        facility_id,
        targetFacility,
        date_str,
      }),

    // ---- 設定 ----
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

    // ---- Update ----
    getUpdateDebugInfo: () =>
      ipcRenderer.invoke("get-update-debug-info"),

    checkForUpdates: () =>
      ipcRenderer.invoke("check-for-updates"),

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

    // ---- webview ----
    getPreloadPath: () =>
      ipcRenderer.invoke("get-preload-path"),

    // ---- Clipboard ----
    copyText: (text) =>
      ipcRenderer.invoke("clipboard:writeText", text),

    // ---- Attendance ----
    saveAttendanceColumnData: (data) => ipcRenderer.invoke("saveAttendanceColumnData", data),

    // ---- MariaDB service_record ----
    mariadb_service_record_insert: (data) => ipcRenderer.invoke("mariadb:service_record:insert", data),
    mariadb_service_record_upsert: (data) => ipcRenderer.invoke("mariadb:service_record:upsert", data),

    // ---- Laravel service_record ----
    // Laravel側は登録・更新ともupsertプロシージャを使用する。
    laravel_service_record_insert: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-service-record", data),

    laravel_service_record_upsert: (data) =>
      ipcRenderer.invoke("laravel:procedure:upsert-service-record", data),

    laravel_service_record_monthly: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:get-service-record-monthly",
        data,
      ),

    // ---- HUG staffs ----
    syncHugStaffs: async (data) => {
      const prefix = await getDbPrefix(ipcRenderer);

      return prefix === "laravel"
        ? ipcRenderer.invoke("laravel:procedure:sync-hug-staffs", data)
        : ipcRenderer.invoke("mariadb:hug_staffs:sync", data);
    },

    laravel_hug_staffs_sync: (data) =>
      ipcRenderer.invoke("laravel:procedure:sync-hug-staffs", data),

    // ---- HUG childrens ----
    syncHugChildrens: async (data) => {
      const prefix = await getDbPrefix(ipcRenderer);

      return prefix === "laravel"
        ? ipcRenderer.invoke(
            "laravel:procedure:register-facility-children",
            data,
          )
        : ipcRenderer.invoke("mariadb:hug_childrens:sync", data);
    },

    laravel_hug_childrens_sync: (data) =>
      ipcRenderer.invoke(
        "laravel:procedure:register-facility-children",
        data,
      ),

    // ---- CRUD API 展開 ----
    ...createTableApis(ipcRenderer),
  };
}

module.exports = {
  createElectronApi,
};
