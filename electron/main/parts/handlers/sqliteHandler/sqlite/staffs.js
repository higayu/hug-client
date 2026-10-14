// main/parts/handlers/sqliteHandler/sqlite/staffs.js

const { connect } = require("./base");

/**
 * SQLite保存用の日時文字列を生成する。
 *
 * @returns {string}
 */
function getCurrentDateTime() {
  return new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
}

/**
 * boolean系の値をSQLite用の0・1へ変換する。
 *
 * @param {unknown} value
 * @param {number} defaultValue
 * @returns {number}
 */
function toBooleanInteger(value, defaultValue = 0) {
  if (
    value === true ||
    value === 1 ||
    value === "1" ||
    value === "true"
  ) {
    return 1;
  }

  if (
    value === false ||
    value === 0 ||
    value === "0" ||
    value === "false"
  ) {
    return 0;
  }

  return defaultValue;
}

/**
 * 整数値へ変換する。
 *
 * @param {unknown} value
 * @param {number|null} defaultValue
 * @returns {number|null}
 */
function toNullableInteger(value, defaultValue = null) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return defaultValue;
  }

  const numberValue = Number(value);

  return Number.isInteger(numberValue)
    ? numberValue
    : defaultValue;
}

/**
 * 空文字をnullへ変換する。
 *
 * @param {unknown} value
 * @returns {unknown}
 */
function toNullableValue(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  return value;
}

/**
 * スタッフIDを検証する。
 *
 * @param {unknown} id
 * @returns {number}
 */
function normalizeStaffId(id) {
  const staffId = Number(id);

  if (
    !Number.isInteger(staffId) ||
    staffId < 1
  ) {
    throw new TypeError(
      "有効なスタッフIDを指定してください。"
    );
  }

  return staffId;
}

/**
 * INSERT用のデータへ変換する。
 *
 * @param {object} data
 * @returns {object}
 */
function normalizeInsertData(data = {}) {
  const now = getCurrentDateTime();

  return {
    id: normalizeStaffId(data.id),

    name:
      typeof data.name === "string"
        ? data.name.trim()
        : "",

    login_id: toNullableValue(data.login_id),

    password_hash:
      toNullableValue(data.password_hash),

    work_style: toNullableValue(data.work_style),

    notes:
      data.notes === null ||
      data.notes === undefined
        ? ""
        : String(data.notes),

    is_delete: toBooleanInteger(
      data.is_delete,
      0
    ),

    role_id: toNullableInteger(
      data.role_id,
      0
    ),

    display_order: toNullableInteger(
      data.display_order
    ),

    entered_at: toNullableValue(
      data.entered_at
    ),

    leaving_at: toNullableValue(
      data.leaving_at
    ),

    hug_updated_at: toNullableValue(
      data.hug_updated_at
    ),

    hug_updated_by: toNullableValue(
      data.hug_updated_by
    ),

    created_at:
      toNullableValue(data.created_at) ?? now,

    updated_at:
      toNullableValue(data.updated_at) ?? now,
  };
}

/**
 * UPDATEするカラム値を正規化する。
 *
 * @param {string} column
 * @param {unknown} value
 * @returns {unknown}
 */
function normalizeColumnValue(column, value) {
  switch (column) {
    case "is_delete":
      return toBooleanInteger(value, 0);

    case "role_id":
      return toNullableInteger(value, 0);

    case "display_order":
      return toNullableInteger(value);

    case "notes":
      return value === null ||
        value === undefined
        ? null
        : String(value);

    case "login_id":
    case "password_hash":
    case "work_style":
    case "entered_at":
    case "leaving_at":
    case "hug_updated_at":
    case "hug_updated_by":
    case "created_at":
    case "updated_at":
      return toNullableValue(value);

    case "name":
      return typeof value === "string"
        ? value.trim()
        : value;

    default:
      return value;
  }
}

/**
 * 更新可能なstaffsカラム。
 *
 * idは主キーなので更新対象外。
 */
const UPDATABLE_COLUMNS = [
  "name",
  "login_id",
  "password_hash",
  "work_style",
  "notes",
  "is_delete",
  "role_id",
  "display_order",
  "entered_at",
  "leaving_at",
  "hug_updated_at",
  "hug_updated_by",
  "created_at",
  "updated_at",
];

module.exports = {
  /**
   * スタッフ一覧を取得する。
   *
   * password_hashは通常の一覧取得では返さない。
   */
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        SELECT
          id,
          name,
          login_id,
          work_style,
          notes,
          is_delete,
          role_id,
          display_order,
          entered_at,
          leaving_at,
          hug_updated_at,
          hug_updated_by,
          created_at,
          updated_at
        FROM staffs
        ORDER BY
          CASE
            WHEN display_order IS NULL THEN 1
            ELSE 0
          END,
          display_order ASC,
          id ASC;
      `;

      db.all(sql, [], (error, rows) => {
        db.close();

        if (error) {
          reject(error);
          return;
        }

        resolve(rows);
      });
    });
  },

  /**
   * 有効なスタッフ一覧を取得する。
   */
  getActive() {
    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        SELECT
          id,
          name,
          login_id,
          work_style,
          notes,
          is_delete,
          role_id,
          display_order,
          entered_at,
          leaving_at,
          hug_updated_at,
          hug_updated_by,
          created_at,
          updated_at
        FROM staffs
        WHERE is_delete = 0
        ORDER BY
          CASE
            WHEN display_order IS NULL THEN 1
            ELSE 0
          END,
          display_order ASC,
          id ASC;
      `;

      db.all(sql, [], (error, rows) => {
        db.close();

        if (error) {
          reject(error);
          return;
        }

        resolve(rows);
      });
    });
  },

  /**
   * スタッフIDで1件取得する。
   */
  getById(id) {
    return new Promise((resolve, reject) => {
      let staffId;

      try {
        staffId = normalizeStaffId(id);
      } catch (error) {
        reject(error);
        return;
      }

      const db = connect();

      const sql = `
        SELECT
          id,
          name,
          login_id,
          work_style,
          notes,
          is_delete,
          role_id,
          display_order,
          entered_at,
          leaving_at,
          hug_updated_at,
          hug_updated_by,
          created_at,
          updated_at
        FROM staffs
        WHERE id = ?
        LIMIT 1;
      `;

      db.get(
        sql,
        [staffId],
        (error, row) => {
          db.close();

          if (error) {
            reject(error);
            return;
          }

          resolve(row ?? null);
        }
      );
    });
  },

  /**
   * ローカル認証用にログインIDから取得する。
   *
   * password_hashを返すため、
   * renderer側へそのまま渡さないこと。
   */
  getByLoginId(loginId) {
    return new Promise((resolve, reject) => {
      const normalizedLoginId =
        typeof loginId === "string"
          ? loginId.trim()
          : "";

      if (!normalizedLoginId) {
        reject(
          new TypeError(
            "ログインIDを指定してください。"
          )
        );
        return;
      }

      const db = connect();

      const sql = `
        SELECT
          id,
          name,
          login_id,
          password_hash,
          work_style,
          notes,
          is_delete,
          role_id,
          display_order,
          entered_at,
          leaving_at,
          hug_updated_at,
          hug_updated_by,
          created_at,
          updated_at
        FROM staffs
        WHERE login_id = ?
          AND is_delete = 0
        LIMIT 1;
      `;

      db.get(
        sql,
        [normalizedLoginId],
        (error, row) => {
          db.close();

          if (error) {
            reject(error);
            return;
          }

          resolve(row ?? null);
        }
      );
    });
  },

  /**
   * スタッフを登録する。
   */
  insert(data) {
    return new Promise((resolve, reject) => {
      let staff;

      try {
        staff = normalizeInsertData(data);

        if (!staff.name) {
          throw new TypeError(
            "スタッフ名を指定してください。"
          );
        }
      } catch (error) {
        reject(error);
        return;
      }

      const db = connect();

      const sql = `
        INSERT INTO staffs (
          id,
          name,
          login_id,
          password_hash,
          work_style,
          notes,
          is_delete,
          role_id,
          display_order,
          entered_at,
          leaving_at,
          hug_updated_at,
          hug_updated_by,
          created_at,
          updated_at
        )
        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?
        );
      `;

      const params = [
        staff.id,
        staff.name,
        staff.login_id,
        staff.password_hash,
        staff.work_style,
        staff.notes,
        staff.is_delete,
        staff.role_id,
        staff.display_order,
        staff.entered_at,
        staff.leaving_at,
        staff.hug_updated_at,
        staff.hug_updated_by,
        staff.created_at,
        staff.updated_at,
      ];

      db.run(
        sql,
        params,
        function (error) {
          db.close();

          if (error) {
            reject(error);
            return;
          }

          /*
           * staffs.idは自動採番ではないため、
           * lastIDではなく指定されたスタッフIDを返す。
           */
          resolve(staff.id);
        }
      );
    });
  },

  /**
   * スタッフ情報を部分更新する。
   *
   * dataに含まれているカラムだけ更新する。
   */
  update(id, data = {}) {
    return new Promise((resolve, reject) => {
      let staffId;

      try {
        staffId = normalizeStaffId(id);
      } catch (error) {
        reject(error);
        return;
      }

      const sets = [];
      const params = [];

      for (const column of UPDATABLE_COLUMNS) {
        if (
          Object.prototype.hasOwnProperty.call(
            data,
            column
          )
        ) {
          sets.push(`${column} = ?`);

          params.push(
            normalizeColumnValue(
              column,
              data[column]
            )
          );
        }
      }

      /*
       * updated_atが明示されていない場合は現在日時を設定する。
       */
      if (
        !Object.prototype.hasOwnProperty.call(
          data,
          "updated_at"
        )
      ) {
        sets.push("updated_at = ?");
        params.push(getCurrentDateTime());
      }

      if (sets.length === 0) {
        resolve(0);
        return;
      }

      params.push(staffId);

      const db = connect();

      const sql = `
        UPDATE staffs
        SET ${sets.join(", ")}
        WHERE id = ?;
      `;

      db.run(
        sql,
        params,
        function (error) {
          db.close();

          if (error) {
            reject(error);
            return;
          }

          resolve(this.changes);
        }
      );
    });
  },

  /**
   * スタッフを論理削除する。
   */
  delete(id) {
    return new Promise((resolve, reject) => {
      let staffId;

      try {
        staffId = normalizeStaffId(id);
      } catch (error) {
        reject(error);
        return;
      }

      const db = connect();

      const sql = `
        UPDATE staffs
        SET
          is_delete = 1,
          updated_at = ?
        WHERE id = ?;
      `;

      db.run(
        sql,
        [
          getCurrentDateTime(),
          staffId,
        ],
        function (error) {
          db.close();

          if (error) {
            reject(error);
            return;
          }

          resolve(this.changes);
        }
      );
    });
  },

  /**
   * 論理削除されたスタッフを復元する。
   */
  restore(id) {
    return new Promise((resolve, reject) => {
      let staffId;

      try {
        staffId = normalizeStaffId(id);
      } catch (error) {
        reject(error);
        return;
      }

      const db = connect();

      const sql = `
        UPDATE staffs
        SET
          is_delete = 0,
          updated_at = ?
        WHERE id = ?;
      `;

      db.run(
        sql,
        [
          getCurrentDateTime(),
          staffId,
        ],
        function (error) {
          db.close();

          if (error) {
            reject(error);
            return;
          }

          resolve(this.changes);
        }
      );
    });
  },

  /**
   * スタッフを物理削除する。
   *
   * 原則としてdelete()による論理削除を使用する。
   */
  forceDelete(id) {
    return new Promise((resolve, reject) => {
      let staffId;

      try {
        staffId = normalizeStaffId(id);
      } catch (error) {
        reject(error);
        return;
      }

      const db = connect();

      db.run(
        "DELETE FROM staffs WHERE id = ?;",
        [staffId],
        function (error) {
          db.close();

          if (error) {
            reject(error);
            return;
          }

          resolve(this.changes);
        }
      );
    });
  },
};