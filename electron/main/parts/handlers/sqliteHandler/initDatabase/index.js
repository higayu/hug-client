// main/parts/handlers/sqliteHandler/initDatabase/index.js

const fs = require("fs");
const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const {
  getDbPath,
} = require("../../../utils/pathResolver");

const {
  execSql,
  closeDatabase,
  getExistingTables,
} = require("./helpers");

const {
  INIT_SQL,
} = require("./schema/index");

const {
  migrateLegacyDayOfWeekIfNeeded,
} = require(
  "./migrations/migrateLegacyDayOfWeek"
);

const {
  migrateExistingDatabase,
} = require(
  "./migrations/migrateExistingDatabase"
);

const {
  migrateManagers2ToFacilitySchema,
} = require(
  "./migrations/migrateManagers2ToFacilitySchema"
);

const {
  createIndexes,
} = require("./indexes");

const {
  seedDayOfWeek,
} = require("./seeds/seedDayOfWeek");

/**
 * SQLiteデータベースを開く。
 *
 * @param {string} dbPath
 * @returns {Promise<sqlite3.Database>}
 */
function openDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(
      dbPath,
      (error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(db);
      }
    );
  });
}

/**
 * 必須テーブルが作成されているか確認する。
 *
 * @param {sqlite3.Database} db
 * @param {string[]} tableNames
 * @returns {Promise<void>}
 */
async function assertRequiredTablesExist(
  db,
  tableNames
) {
  const existingTables =
    await getExistingTables(db);

  const existingTableSet =
    new Set(existingTables);

  const missingTables =
    tableNames.filter(
      (tableName) =>
        !existingTableSet.has(tableName)
    );

  console.log(
    "[initDatabase] existing tables:",
    existingTables
  );

  if (missingTables.length > 0) {
    throw new Error(
      [
        "SQLite初期化後も必要なテーブルが存在しません。",
        `missing: ${missingTables.join(", ")}`,
      ].join("\n")
    );
  }
}

/**
 * SQLiteデータベース初期化。
 *
 * 呼び出し側で必ずawaitする。
 *
 * @returns {Promise<{
 *   success: boolean,
 *   dbPath: string,
 *   tables: string[]
 * }>}
 */
async function initializeDatabase() {
  const dbPath = getDbPath();
  const dir = path.dirname(dbPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(
      dir,
      {
        recursive: true,
      }
    );
  }

  let db = null;

  console.group(
    "[initDatabase] initializeDatabase START"
  );

  try {
    db = await openDatabase(dbPath);

    /*
     * execSqlはdb.exec()を使用すること。
     * PRAGMAとINIT_SQLは複数SQL文を含む。
     */
    await execSql(
      db,
      `
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = OFF;
      `
    );

    /*
     * 古いday_of_week構造を先に補正する。
     */
    await migrateLegacyDayOfWeekIfNeeded(db);

    /*
     * 全初期テーブルを作成する。
     * INIT_SQLには複数のCREATE文が含まれる。
     */
    await execSql(
      db,
      INIT_SQL
    );

    /*
     * 既存DB向けのカラム追加・構造変更。
     */
    await migrateExistingDatabase(db);

    /*
     * managers2の複合主キー構造を補正する。
     */
    await migrateManagers2ToFacilitySchema(db);

    /*
     * 必要なインデックスを作成する。
     */
    await createIndexes(db);

    /*
     * 曜日マスターを投入する。
     */
    await seedDayOfWeek(db);

    /*
     * 初期化処理の最後に外部キー制約を戻す。
     */
    await execSql(
      db,
      `
        PRAGMA foreign_keys = ON;
      `
    );

    const requiredTables = [
      "children_type",
      "pronunciation",
      "day_of_week",
      "facilitys",
      "staffs",
      "record_types",
      "m_service_items",
      "m_pronpt_items",
      "ai_prompts",
      "ai_prompt_histories",
      "users",
      "memo",
      "text_data",
      "children",
      "pc",
      "facility_children",
      "facility_staff",
      "staff_facility_roles",
      "managers2",
      "pc_to_children",
      "temp_notes",
      "child_records",
      "service_record",
      "refresh_tokens",
      "toolbox",
      "individual_support",
    ];

    await assertRequiredTablesExist(
      db,
      requiredTables
    );

    const tables =
      await getExistingTables(db);

    console.log(
      "[initDatabase] database initialized:",
      dbPath
    );

    return {
      success: true,
      dbPath,
      tables,
    };
  } catch (error) {
    console.error(
      "[initDatabase] initialization error:",
      error
    );

    /*
     * 呼び出し側に失敗を伝える。
     * ここで握りつぶさない。
     */
    throw error;
  } finally {
    if (db) {
      try {
        await closeDatabase(db);
      } catch (closeError) {
        console.error(
          "[initDatabase] DB close error:",
          closeError
        );
      }
    }

    console.groupEnd();
  }
}

module.exports = {
  initializeDatabase,
};
