// main/parts/handlers/sqliteHandler/index.js

const { initializeDatabase } = require("./initDatabase");
const apiClient = require("../../../../../src/apiClient");

// MariaDBからSqliteへデータを同期処理
const { connect } = require("./sqlite/base");

// ============================================================
// DB 初期化
// ============================================================
initializeDatabase();

// ============================================================
// 各テーブルモジュール
// ============================================================

// 既存テーブル
const children = require("./sqlite/children");
const staffs = require("./sqlite/staffs");
const facilitys = require("./sqlite/facilitys");
const facility_children = require("./sqlite/facility_children");
const facility_staff = require("./sqlite/facility_staff");
const managers2 = require("./sqlite/managers2");
const pc = require("./sqlite/pc");
const pc_to_children = require("./sqlite/pc_to_children");
const individual_support = require("./sqlite/individual_support");
const temp_notes = require("./sqlite/temp_notes");
const pronunciation = require("./sqlite/pronunciation");
const children_type = require("./sqlite/children_type");
const day_of_week = require("./sqlite/day_of_week");

// MariaDB 追加テーブル / SQLite フォールバック用
const record_types = require("./sqlite/record_types");
const child_records = require("./sqlite/child_records");
const m_service_items = require("./sqlite/m_service_items");
const service_record = require("./sqlite/service_record");
const {
  getServiceRecordMonthly,
} = require("./sqlite/get_service_record_monthly");
const staff_facility_roles = require("./sqlite/staff_facility_roles");
const text_data = require("./sqlite/text_data");
const toolbox = require("./sqlite/toolbox");
const memo = require("./sqlite/memo");
const ai_prompts = require("./sqlite/ai_prompts");
const m_pronpt_items = require("./sqlite/m_pronpt_items");

// ============================================================
// IPC 重複登録防止
// ============================================================

const registeredChannels = new Set();

function safeHandle(ipcMain, channel, handler) {
  if (registeredChannels.has(channel)) {
    console.warn(`⚠️ SQLite IPC handler already registered: ${channel}`);
    return;
  }

  ipcMain.handle(channel, handler);
  registeredChannels.add(channel);
}

// ============================================================
// SQLite Promise Helper
// ============================================================

function runSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);

      resolve({
        lastID: this.lastID,
        changes: this.changes,
      });
    });
  });
}

function allSql(db, sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function closeDb(db) {
  return new Promise((resolve) => {
    if (!db) return resolve();

    db.close((err) => {
      if (err) {
        console.error("❌ SQLite close error:", err);
      }
      resolve();
    });
  });
}

async function getTableColumns(db, tableName) {
  const rows = await allSql(db, `PRAGMA table_info("${tableName}");`);
  return rows.map((row) => row.name);
}

function normalizeSyncValue(tableName, columnName, value) {
  if (value === undefined) return null;

  // day_of_week.days は getAll 側で配列に戻しているため、保存時は JSON 文字列に戻す
  if (
    tableName === "day_of_week" &&
    columnName === "days" &&
    Array.isArray(value)
  ) {
    return JSON.stringify(value);
  }

  // 万が一、配列やオブジェクトが来た場合は JSON 文字列として保存
  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return value;
}

async function insertRows(db, tableName, rows) {
  if (!Array.isArray(rows)) {
    return {
      table: tableName,
      skipped: true,
      reason: "payload is not array",
    };
  }

  const tableColumns = await getTableColumns(db, tableName);

  if (!tableColumns || tableColumns.length === 0) {
    return {
      table: tableName,
      skipped: true,
      reason: "table not found or no columns",
    };
  }

  if (rows.length === 0) {
    return {
      table: tableName,
      inserted: 0,
    };
  }

  let inserted = 0;

  for (const row of rows) {
    if (!row || typeof row !== "object") continue;

    // SQLite に実在するカラムだけ INSERT 対象にする
    const insertColumns = tableColumns.filter((columnName) =>
      Object.prototype.hasOwnProperty.call(row, columnName)
    );

    if (insertColumns.length === 0) {
      console.warn(`⚠️ ${tableName}: INSERT可能なカラムがありません`, row);
      continue;
    }

    const columnSql = insertColumns.map((col) => `"${col}"`).join(", ");
    const placeholders = insertColumns.map(() => "?").join(", ");

    const values = insertColumns.map((col) =>
      normalizeSyncValue(tableName, col, row[col])
    );

    const sql = `
      INSERT OR REPLACE INTO "${tableName}" (${columnSql})
      VALUES (${placeholders});
    `;

    await runSql(db, sql, values);
    inserted += 1;
  }

  return {
    table: tableName,
    inserted,
  };
}

// ============================================================
// fetchTableAll 戻り値の正規化
// ============================================================

function normalizeFetchTableAllResult(fetchResult) {
  console.log("🔎 [sqlite:database:sync] normalizeFetchTableAllResult:", {
    hasFetchResult: !!fetchResult,
    type: typeof fetchResult,
    isArray: Array.isArray(fetchResult),
    keys:
      fetchResult && typeof fetchResult === "object"
        ? Object.keys(fetchResult)
        : [],
  });

  if (!fetchResult || typeof fetchResult !== "object") {
    return null;
  }

  // API側が失敗レスポンスを返した場合
  if (fetchResult.success === false) {
    throw new Error(
      fetchResult.error ||
        fetchResult.message ||
        "fetchTableAll が success:false を返しました"
    );
  }

  // 想定パターン:
  // 1. { children: [...], staffs: [...], ... }
  // 2. { data: { children: [...], staffs: [...] } }
  // 3. { tables: { children: [...], staffs: [...] } }
  const databaseState =
    fetchResult.data ??
    fetchResult.tables ??
    fetchResult;

  if (!databaseState || typeof databaseState !== "object") {
    return null;
  }

  console.log("📦 [sqlite:database:sync] normalized databaseState:", {
    tableNames: Object.keys(databaseState),
  });

  return databaseState;
}

// テーブルの定義の確認
async function getExpectedColumnsFromRows(rows) {
  const columnSet = new Set()

  if (!Array.isArray(rows)) return []

  for (const row of rows) {
    if (!row || typeof row !== "object") continue

    Object.keys(row).forEach((key) => {
      columnSet.add(key)
    })
  }

  return Array.from(columnSet)
}

async function validateTableSchema(db, tableName, rows) {
  const sqliteColumns = await getTableColumns(db, tableName)
  const expectedColumns = await getExpectedColumnsFromRows(rows)

  const missingColumns = expectedColumns.filter(
    (columnName) => !sqliteColumns.includes(columnName)
  )

  const valid = missingColumns.length === 0

  console.log(`🔍 [schema-check] ${tableName}:`, {
    valid,
    sqliteColumns,
    expectedColumns,
    missingColumns,
  })

  return {
    tableName,
    valid,
    sqliteColumns,
    expectedColumns,
    missingColumns,
  }
}

async function validateDatabaseSchema(db, databaseState, syncOrder) {
  console.group("🔍 [schema-check] SQLite schema validation START")

  const results = []

  for (const tableName of syncOrder) {
    const rows = databaseState[tableName]

    if (!Array.isArray(rows)) {
      console.log(`⏭️ [schema-check] skip: ${tableName}`, {
        reason: "fetchTableAll result does not have array",
      })
      continue
    }

    const result = await validateTableSchema(db, tableName, rows)
    results.push(result)
  }

  const invalidTables = results.filter((result) => !result.valid)

  const valid = invalidTables.length === 0

  console.log("🔍 [schema-check] SQLite schema validation result:", {
    valid,
    invalidTables,
  })

  console.groupEnd()

  return {
    valid,
    results,
    invalidTables,
  }
}

async function dropSyncTargetTables(db, syncOrder) {
  console.group("🧨 [schema-rebuild] DROP sync target tables START")

  const dropOrder = [...syncOrder].reverse()

  await runSql(db, "PRAGMA foreign_keys = OFF;")

  for (const tableName of dropOrder) {
    console.log(`🧨 DROP TABLE IF EXISTS: ${tableName}`)
    await runSql(db, `DROP TABLE IF EXISTS "${tableName}";`)
  }

  await runSql(db, "PRAGMA foreign_keys = ON;")

  console.groupEnd()
}

async function rebuildDatabaseIfSchemaInvalid(db, databaseState, syncOrder) {
  const schemaCheck = await validateDatabaseSchema(db, databaseState, syncOrder)

  if (schemaCheck.valid) {
    console.log("✅ [schema-rebuild] SQLite schema is latest. rebuild skipped.")

    return {
      rebuilt: false,
      schemaCheck,
    }
  }

  console.warn(
    "⚠️ [schema-rebuild] SQLite schema is old. Rebuilding tables...",
    schemaCheck.invalidTables
  )

  await dropSyncTargetTables(db, syncOrder)

  console.log("🔄 [schema-rebuild] initializeDatabase() を再実行します")
  initializeDatabase()

  console.log("✅ [schema-rebuild] SQLite tables rebuilt")

  return {
    rebuilt: true,
    schemaCheck,
  }
}

// ============================================================
// 📘 SQLite IPCハンドラ登録（sqlite: プレフィックス付き）
// ============================================================

function registerSqliteHandlers(ipcMain) {
  console.log("🔥 registerSqliteHandlers (sqlite) CALLED");

  const tables = {
    // 既存テーブル
    children,
    staffs,
    facilitys,
    facility_children,
    facility_staff,
    managers2,
    pc,
    pc_to_children,
    individual_support,
    temp_notes,
    pronunciation,
    children_type,
    day_of_week,

    // MariaDB 追加テーブル / SQLite フォールバック用
    record_types,
    child_records,
    m_service_items,
    service_record,
    staff_facility_roles,
    text_data,
    toolbox,
    memo,
    m_pronpt_items,
    ai_prompts,
  };

  // apiClient.fetchTableAll() から SQLite に同期する対象
  // loading / error / metadata は Redux 管理用なので同期しない
  const syncOrder = [
    // マスタ系
    "children_type",
    "pronunciation",
    "facilitys",
    "staffs",
    "children",
    "day_of_week",
    "pc",

    // MariaDB 追加マスタ系
    "record_types",
    "m_service_items",
    "m_pronpt_items",
    "staff_facility_roles",
    "text_data",
    "toolbox",
    "ai_prompts",
    "ai_prompt_histories",

    // 関連テーブル
    "facility_staff",
    "facility_children",
    "managers2",
    "pc_to_children",

    // 記録系
    "individual_support",
    "child_records",
    "memo",

    // temp_notes
    "temp_notes",
  ];

  // ============================================================
  // CRUD 共通
  // ============================================================

  for (const [table, handler] of Object.entries(tables)) {
    if (!handler) {
      console.warn(`⚠️ SQLite handler missing: ${table}`);
      continue;
    }

    if (handler.getAll) {
      safeHandle(ipcMain, `sqlite:${table}:getAll`, async () => {
        return handler.getAll();
      });
    }

    if (handler.getById) {
      safeHandle(ipcMain, `sqlite:${table}:getById`, async (_, id) => {
        return handler.getById(id);
      });
    }

    if (handler.insert) {
      safeHandle(ipcMain, `sqlite:${table}:insert`, async (_, data) => {
        return handler.insert(data);
      });
    }

    if (handler.update) {
      safeHandle(
        ipcMain,
        `sqlite:${table}:update`,
        async (_, idOrData, maybeData) => {
          if (maybeData !== undefined) {
            return handler.update(idOrData, maybeData);
          }

          return handler.update(idOrData);
        }
      );
    }

    if (handler.delete) {
      safeHandle(ipcMain, `sqlite:${table}:delete`, async (_, ...args) => {
        return handler.delete(...args);
      });
    }

    if (handler.upsert) {
      safeHandle(ipcMain, `sqlite:${table}:upsert`, async (_, data) => {
        return handler.upsert(data);
      });
    }

    if (handler.upsert1) {
      safeHandle(ipcMain, `sqlite:${table}:upsert1`, async (_, data) => {
        return handler.upsert1(data);
      });
    }

    if (handler.upsert2) {
      safeHandle(ipcMain, `sqlite:${table}:upsert2`, async (_, data) => {
        return handler.upsert2(data);
      });
    }
  }

  // ============================================================
  // 🟢 apiClient.fetchTableAll() のデータを SQLite に同期
  // ============================================================

  safeHandle(ipcMain, "sqlite:database:sync", async () => {
    const db = connect();

    try {
      console.log("==================================================");
      console.log("🔄 [sqlite:database:sync] START");
      console.log("📡 [sqlite:database:sync] apiClient.fetchTableAll() を実行します");
      console.log("==================================================");

      console.time("⏱ [sqlite:database:sync] total sync time");

      // MariaDB/API 側から全テーブル取得
      const fetchResult = await apiClient.fetchTableAll();

      console.log("📦 [sqlite:database:sync] fetchTableAll raw result:", {
        type: typeof fetchResult,
        isArray: Array.isArray(fetchResult),
        keys:
          fetchResult && typeof fetchResult === "object"
            ? Object.keys(fetchResult)
            : [],
      });

      const databaseState = normalizeFetchTableAllResult(fetchResult);

      if (!databaseState || typeof databaseState !== "object") {
        throw new Error(
          "fetchTableAll から SQLite 同期対象データを取得できませんでした"
        );
      }

      console.log("📦 [sqlite:database:sync] 同期対象テーブル一覧:", {
        tableNames: Object.keys(databaseState),
      });

      // ============================================================
      // SQLite テーブル定義チェック
      // 古い定義の場合は DROP → initializeDatabase() で作り直す
      // ============================================================
      const rebuildResult = await rebuildDatabaseIfSchemaInvalid(
        db,
        databaseState,
        syncOrder
      )

      console.log("🧱 [sqlite:database:sync] schema rebuild result:", rebuildResult)

      const deleteOrder = [...syncOrder].reverse();

      await runSql(db, "PRAGMA foreign_keys = OFF;");
      await runSql(db, "BEGIN TRANSACTION;");

      console.log("🧹 [sqlite:database:sync] DELETE phase START");

      // 先に同期対象テーブルを空にする
      for (const tableName of deleteOrder) {
        const rows = databaseState[tableName];

        // fetchTableAll の結果に存在しないものは触らない
        if (!Array.isArray(rows)) {
          console.log(`⏭️ SQLite DELETE skip: ${tableName}`, {
            reason: "fetchTableAll result does not have array",
            valueType: typeof rows,
          });
          continue;
        }

        console.log(`🧹 SQLite DELETE: ${tableName}`);
        await runSql(db, `DELETE FROM "${tableName}";`);
      }

      console.log("✅ [sqlite:database:sync] DELETE phase END");

      const results = [];

      console.log("📥 [sqlite:database:sync] INSERT phase START");

      // fetchTableAll の結果から SQLite へ INSERT
      for (const tableName of syncOrder) {
        const rows = databaseState[tableName];

        // fetchTableAll の結果に存在しないものは触らない
        if (!Array.isArray(rows)) {
          const skippedResult = {
            table: tableName,
            skipped: true,
            reason: "fetchTableAll result does not have array",
          };

          console.log(`⏭️ SQLite INSERT skip: ${tableName}`, skippedResult);
          results.push(skippedResult);
          continue;
        }

        console.log(`📥 SQLite INSERT: ${tableName}`, {
          rowCount: rows.length,
        });

        const result = await insertRows(db, tableName, rows);

        console.log(`✅ SQLite INSERT DONE: ${tableName}`, result);

        results.push(result);
      }

      console.log("✅ [sqlite:database:sync] INSERT phase END");

      await runSql(db, "COMMIT;");
      await runSql(db, "PRAGMA foreign_keys = ON;");

      console.timeEnd("⏱ [sqlite:database:sync] total sync time");

      console.log("✅ [sqlite:database:sync] DONE:", results);

      return {
        success: true,
        source: "apiClient.fetchTableAll",
        results,
      };
    } catch (err) {
      console.error("❌ [sqlite:database:sync] ERROR:", err);

      try {
        await runSql(db, "ROLLBACK;");
      } catch (rollbackErr) {
        console.error("❌ SQLite ROLLBACK エラー:", rollbackErr);
      }

      try {
        await runSql(db, "PRAGMA foreign_keys = ON;");
      } catch (pragmaErr) {
        console.error("❌ SQLite foreign_keys ON エラー:", pragmaErr);
      }

      throw err;
    } finally {
      await closeDb(db);
      console.log("🏁 [sqlite:database:sync] END");
    }
  });

  // ============================================================
  // 🟢 temp_notes（SQLite 専用）
  // ============================================================

  safeHandle(ipcMain, "sqlite:saveTempNote", async (_, data) => {
    try {
      const result = await temp_notes.upsert(data);

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      console.error("❌ SQLite saveTempNote エラー:", err);
      throw err;
    }
  });

  safeHandle(ipcMain, "sqlite:saveTempNote1", async (_, data) => {
    try {
      const result = await temp_notes.upsert1(data);

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      console.error("❌ SQLite saveTempNote1 エラー:", err);
      throw err;
    }
  });

  safeHandle(ipcMain, "sqlite:saveTempNote2", async (_, data) => {
    try {
      const result = await temp_notes.upsert2(data);

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      console.error("❌ SQLite saveTempNote2 エラー:", err);
      throw err;
    }
  });

  safeHandle(ipcMain, "sqlite:getTempNote", async (_, data) => {
    try {
      const { children_id, staff_id, day_of_week_id } = data;

      const result = await temp_notes.getTempNote(
        children_id,
        staff_id,
        day_of_week_id
      );

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      console.error("❌ SQLite getTempNote エラー:", err);
      throw err;
    }
  });

  safeHandle(ipcMain, "sqlite:service_record:get-monthly", async (_, data) => {
    return getServiceRecordMonthly(data);
  });

  safeHandle(
    ipcMain,
    "sqlite:procedure:get-active-ai-prompt",
    async (_, data) => ai_prompts.getActiveAiPrompt(data)
  );

  safeHandle(
    ipcMain,
    "sqlite:procedure:upsert-ai-prompt",
    async (_, data) => ai_prompts.upsertAiPrompt(data)
  );
}

module.exports = {
  registerSqliteHandlers,
};
