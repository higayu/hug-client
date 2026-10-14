// main/parts/handlers/mariadbHandler/index.js

const apiClient = require("../../../../../src/apiClient");

const {
  upsertServiceRecord,
} = require("./procedures/UpsertServiceRecord");

const {
  syncHugStaffs,
} = require("./procedures/SyncHugStaffs");

const {
  syncHugChildrens,
} = require("./procedures/SyncHugChildrens");

const {
  upsertTempNote,
  upsertTempNote1,
  upsertTempNote2,
  getTempNote,
} = require("./crud/UpsertTempNote");

const {
  delete_manager,
} = require("./crud/managers2");

const {
  getServiceRecordMonthly,
} = require("./procedures/get_service_record_monthly");

const {
  getActiveAiPrompt,
} = require("./procedures/get_active_ai_prompt");

const {
  upsertAiPrompt,
} = require("./procedures/upsert_ai_prompt");

/**
 * 空判定
 * 0 は有効値として扱う
 */
function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

/**
 * pk / values を MariaDB API 用に正規化
 * - 配列 → CSV
 * - 文字列 → そのまま
 */
function normalizePkValues(pk, values) {
  const normalizedPk = Array.isArray(pk) ? pk.join(",") : pk;
  const normalizedValues = Array.isArray(values) ? values.join(",") : values;

  if (isEmpty(normalizedPk) || isEmpty(normalizedValues)) {
    throw new Error("pk / values が不正です");
  }

  return {
    pk: normalizedPk,
    values: normalizedValues,
  };
}

/**
 * SQL風ログ用
 */
function buildWherePreview(pk, values) {
  const pkList = Array.isArray(pk) ? pk : String(pk).split(",");
  const valueList = Array.isArray(values) ? values : String(values).split(",");

  return pkList
    .map((key, index) => {
      const value = valueList[index];

      return `${key} = ${
        value === null || value === undefined || value === ""
          ? "NULL"
          : Number.isNaN(Number(value))
            ? `'${value}'`
            : value
      }`;
    })
    .join(" AND ");
}

/**
 * SQL風 SET ログ用
 */
function buildSetPreview(data) {
  return Object.entries(data ?? {})
    .map(([key, value]) => {
      return `${key} = ${
        value === null || value === undefined || value === ""
          ? "NULL"
          : Number.isNaN(Number(value))
            ? `'${value}'`
            : value
      }`;
    })
    .join(",\n          ");
}

function registerMariadbHandlers(ipcMain) {
  // MariaDB 全テーブル取得
  ipcMain.handle("mariadb-fetch-table-all", async () => {
    console.log("🔄 [MariaDB API] fetchTableAll START");

    try {
      const result = await apiClient.fetchTableAll();
      console.log("✅ [MariaDB API] fetchTableAll DONE");
      return result;
    } catch (error) {
      console.error("❌ [MariaDB API] fetchTableAll ERROR:", error);
      throw error;
    }
  });

  console.log("🔥 registerMariadbHandlers (mariadb) CALLED");

  // ============================================================
  // MariaDB / API 接続確認
  // ============================================================
  ipcMain.handle("mariadb:connection:check", async () => {
    try {
      const result = await apiClient.checkConnection();

      if (!result?.connected) {
        return {
          success: false,
          connected: false,
          message: result?.message || "API server connection failed",
          url: result?.url || null,
          code: result?.code || null,
          status: result?.status || null,
          statusText: result?.statusText || null,
          data: result?.data || null,
        };
      }

      const healthData = result.data;

      return {
        success: true,
        connected: true,
        message: healthData?.message || "API server connection OK",
        status: healthData?.status || "ok",
        serverHost: healthData?.serverHost || null,
        timestamp: healthData?.timestamp || null,
        url: result.url || null,
        data: healthData,
      };
    } catch (err) {
      console.error("❌ MariaDB connection check failed:", err);

      return {
        success: false,
        connected: false,
        message: err.message || "MariaDB/API connection failed",
        code: err.code || null,
        status: err.response?.status || null,
        statusText: err.response?.statusText || null,
        data: err.response?.data || null,
      };
    }
  });

  const tables = [
    "children",
    "staffs",
    "facilitys",
    "facility_children",
    "facility_staff",
    "managers2",
    "pc",
    "pc_to_children",
    "individual_support",
    "pronunciation",
    "children_type",
    "day_of_week",
    "service_record",
    "temp_notes",
    "record_types",
    "child_records",
    "m_service_items",
    "staff_facility_roles",
    "text_data",
    "toolbox",
    "memo",
    "m_pronpt_items",
    "ai_prompts",
    "ai_prompt_histories",
  ];

  for (const table of tables) {
    // --------------------
    // GET ALL
    // --------------------
    ipcMain.handle(`mariadb:${table}:getAll`, async () => {
      console.log(`[mariadb:${table}:getAll]`);

      return apiClient.get(table);
    });

    // --------------------
    // GET BY PK（単一 / 複合対応）
    // --------------------
    ipcMain.handle(`mariadb:${table}:getByPk`, async (_, { pk, values }) => {
      console.log(`[mariadb:${table}:getByPk] raw input:`, {
        pk,
        values,
      });

      const params = normalizePkValues(pk, values);

      console.log(`[mariadb:${table}:getByPk] normalized params:`, params);

      return apiClient.get(`${table}/_search`, {
        params,
      });
    });

    // --------------------
    // INSERT
    // --------------------
    ipcMain.handle(`mariadb:${table}:insert`, async (_, data) => {
      console.log(`[mariadb:${table}:insert]`, data);

      return apiClient.post(table, data);
    });

    // --------------------
    // UPDATE（単一 / 複合対応）
    // --------------------
    ipcMain.handle(`mariadb:${table}:update`, async (_, { pk, values, data }) => {
      console.log("========================================");
      console.log(`[mariadb:${table}:update] START`);
      console.log(`[mariadb:${table}:update] raw input:`, {
        pk,
        values,
        data,
      });

      const params = normalizePkValues(pk, values);

      console.log(`[mariadb:${table}:update] normalized params:`, params);

      if (table === "managers2") {
        const wherePreview = buildWherePreview(params.pk, params.values);
        const setPreview = buildSetPreview(data);

        console.log(
          "[mariadb:managers2:update] SQL preview:",
          `
UPDATE managers2
SET
  ${setPreview}
WHERE
  ${wherePreview};
          `
        );
      }

      console.log(`[mariadb:${table}:update] API PUT:`, {
        table,
        data,
        params,
      });

      try {
        const result = await apiClient.put(table, data, {
          params,
        });

        console.log(`[mariadb:${table}:update] RESULT:`, result);
        console.log(`[mariadb:${table}:update] END`);
        console.log("========================================");

        return result;
      } catch (error) {
        console.error(`[mariadb:${table}:update] ERROR:`, {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });

        console.error(`[mariadb:${table}:update] FAILED REQUEST:`, {
          table,
          data,
          params,
        });

        console.log("========================================");

        throw error;
      }
    });

    // --------------------
    // DELETE（単一 / 複合対応）
    // --------------------
    ipcMain.handle(`mariadb:${table}:delete`, async (_, { pk, values }) => {
      console.log("========================================");
      console.log(`[mariadb:${table}:delete] START`);
      console.log(`[mariadb:${table}:delete] raw input:`, {
        pk,
        values,
      });

      const params = normalizePkValues(pk, values);

      console.log(`[mariadb:${table}:delete] normalized params:`, params);

      if (table === "managers2") {
        const wherePreview = buildWherePreview(params.pk, params.values);

        console.log(
          "[mariadb:managers2:delete] SQL preview:",
          `
DELETE FROM managers2
WHERE
  ${wherePreview};
          `
        );
      }

      try {
        const result = await apiClient.delete(table, {
          params,
        });

        console.log(`[mariadb:${table}:delete] RESULT:`, result);
        console.log(`[mariadb:${table}:delete] END`);
        console.log("========================================");

        return result;
      } catch (error) {
        console.error(`[mariadb:${table}:delete] ERROR:`, {
          message: error?.message,
          response: error?.response?.data,
          status: error?.response?.status,
        });

        console.error(`[mariadb:${table}:delete] FAILED REQUEST:`, {
          table,
          params,
        });

        console.log("========================================");

        throw error;
      }
    });
  }

  // ============================================================
  // managers2 専用削除
  //
  // renderer 側から使う場合:
  // window.electronAPI.deleteManager(
  //   children_id,
  //   facility_id,
  //   staff_id,
  //   day_of_week_id
  // )
  // ============================================================
  ipcMain.handle(
    "mariadb:managers2:deleteManager",
    async (_, { children_id, facility_id, staff_id, day_of_week_id = null }) => {
      console.log("[mariadb:managers2:deleteManager] input:", {
        children_id,
        facility_id,
        staff_id,
        day_of_week_id,
      });

      return delete_manager(
        children_id,
        facility_id,
        staff_id,
        day_of_week_id
      );
    }
  );

  // ============================================================
  // service_record 専用 upsert
  // ============================================================
  ipcMain.handle("mariadb:service_record:upsert", async (_, data) => {
    return upsertServiceRecord(data);
  });

  ipcMain.handle("mariadb:service_record:get-monthly", async (_, data) => {
    return getServiceRecordMonthly(data);
  });

  ipcMain.handle("mariadb:procedure:get-active-ai-prompt", async (_, data) => {
    return getActiveAiPrompt(data);
  });

  ipcMain.handle("mariadb:procedure:upsert-ai-prompt", async (_, data) => {
    return upsertAiPrompt(data);
  });

  // ============================================================
  // temp_notes 専用 handler
  // SQLite 側の saveTempNote / saveTempNote1 / saveTempNote2 / getTempNote と対応
  // ============================================================
  ipcMain.handle("mariadb:temp_notes:upsert", async (_, data) => {
    return upsertTempNote(data);
  });

  ipcMain.handle("mariadb:saveTempNote", async (_, data) => {
    return upsertTempNote(data);
  });

  ipcMain.handle("mariadb:saveTempNote1", async (_, data) => {
    return upsertTempNote1(data);
  });

  ipcMain.handle("mariadb:saveTempNote2", async (_, data) => {
    return upsertTempNote2(data);
  });

  ipcMain.handle("mariadb:getTempNote", async (_, data) => {
    const result = await getTempNote(data);
    return { success: true, data: result };
  });

  // ============================================================
  // HUG staffs sync
  // ============================================================
  ipcMain.handle("mariadb:hug_staffs:sync", async (_, data) => {
    return syncHugStaffs(data);
  });

  // ============================================================
  // HUG childrens sync
  // ============================================================
  ipcMain.handle("mariadb:hug_childrens:sync", async (_, data) => {
    return syncHugChildrens(data);
  });
}

module.exports = { registerMariadbHandlers };
