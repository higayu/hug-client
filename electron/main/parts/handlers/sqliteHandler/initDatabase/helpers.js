// main/parts/handlers/sqliteHandler/initDatabase/helpers.js

/**
 * 複数のSQL文をまとめて実行する。
 *
 * INIT_SQLのように複数のCREATE TABLEを含むSQLで使用する。
 */
function execSql(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

/**
 * 単一SQLを実行する。
 */
function runSql(
  db,
  sql,
  params = []
) {
  return new Promise((resolve, reject) => {
    db.run(
      sql,
      params,
      function (err) {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          changes: this.changes,
          lastID: this.lastID,
        });
      }
    );
  });
}

/**
 * SELECT結果をすべて取得する。
 */
function allSql(
  db,
  sql,
  params = []
) {
  return new Promise((resolve, reject) => {
    db.all(
      sql,
      params,
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(rows);
      }
    );
  });
}

/**
 * SQL実行に失敗しても初期化処理を継続する。
 */
async function tryRunSql(
  db,
  sql,
  label
) {
  try {
    await runSql(db, sql);
  } catch (err) {
    console.warn(
      `[initDatabase] ${label} skipped:`,
      err.message
    );
  }
}

/**
 * SQLite識別子を安全にクォートする。
 */
function quoteIdent(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

/**
 * 指定したテーブルが存在するか確認する。
 */
async function tableExists(
  db,
  tableName
) {
  const rows = await allSql(
    db,
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name = ?
      LIMIT 1
    `,
    [tableName]
  );

  return rows.length > 0;
}

/**
 * 指定したテーブルのカラム名一覧を取得する。
 */
async function getColumns(
  db,
  tableName
) {
  const rows = await allSql(
    db,
    `PRAGMA table_info(${quoteIdent(tableName)})`
  );

  return rows.map((row) => row.name);
}

/**
 * 指定したテーブルの詳細情報を取得する。
 */
async function getTableInfo(
  db,
  tableName
) {
  return allSql(
    db,
    `PRAGMA table_info(${quoteIdent(tableName)})`
  );
}

/**
 * カラムが存在しない場合だけ追加する。
 */
async function ensureColumn(
  db,
  tableName,
  columnName,
  columnDefinition
) {
  const exists = await tableExists(
    db,
    tableName
  );

  if (!exists) {
    return;
  }

  const columns = await getColumns(
    db,
    tableName
  );

  if (columns.includes(columnName)) {
    return;
  }

  await runSql(
    db,
    `
      ALTER TABLE ${quoteIdent(tableName)}
      ADD COLUMN ${columnDefinition}
    `
  );
}

/**
 * SQLite内に存在するユーザーテーブル一覧を取得する。
 *
 * sqlite_sequenceなど、SQLite内部テーブルは除外する。
 */
async function getExistingTables(db) {
  const rows = await allSql(
    db,
    `
      SELECT name
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `
  );

  return rows.map((row) => row.name);
}

/**
 * SQLite接続を閉じる。
 */
function closeDatabase(db) {
  return new Promise((resolve, reject) => {
    if (!db) {
      resolve();
      return;
    }

    db.close((err) => {
      if (err) {
        reject(err);
        return;
      }

      resolve();
    });
  });
}

module.exports = {
  execSql,
  runSql,
  allSql,
  tryRunSql,
  quoteIdent,
  tableExists,
  getColumns,
  getTableInfo,
  ensureColumn,
  getExistingTables,
  closeDatabase,
};