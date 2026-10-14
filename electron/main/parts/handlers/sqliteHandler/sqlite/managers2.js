// main/parts/handlers/sqliteHandler/sqlite/managers2.js
const { connect } = require("./base");

/**
 * 空判定
 * 0 は有効値として扱う
 */
function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

/**
 * managers2 主キー
 * children_id + facility_id + staff_id + day_of_week_id
 */
module.exports = {
  getAll() {
    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        SELECT *
        FROM managers2;
      `;

      console.log("[managers2.getAll] SQL:", sql);

      db.all(sql, [], (err, rows) => {
        db.close();

        if (err) {
          console.error("[managers2.getAll] ERROR:", err);
          return reject(err);
        }

        console.log("[managers2.getAll] rows:", rows);
        resolve(rows);
      });
    });
  },

  insert(data) {
    const {
      children_id,
      facility_id,
      staff_id,
      day_of_week_id,
      priority = 0,
      support_start_time = null,
      support_end_time = null,
    } = data;

    console.log("[managers2.insert] input:", data);

    if (
      isEmpty(children_id) ||
      isEmpty(facility_id) ||
      isEmpty(staff_id) ||
      isEmpty(day_of_week_id)
    ) {
      return Promise.reject(
        new Error(
          "[managers2.insert] children_id, facility_id, staff_id, day_of_week_id は必須です"
        )
      );
    }

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        INSERT INTO managers2 (
          children_id,
          facility_id,
          staff_id,
          day_of_week_id,
          priority,
          support_start_time,
          support_end_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?);
      `;

      const params = [
        children_id,
        facility_id,
        staff_id,
        day_of_week_id,
        priority,
        support_start_time,
        support_end_time,
      ];

      console.log("[managers2.insert] SQL:", sql);
      console.log("[managers2.insert] params:", params);

      db.run(sql, params, function (err) {
        db.close();

        if (err) {
          console.error("[managers2.insert] ERROR:", err);
          return reject(err);
        }

        console.log("[managers2.insert] changes:", this.changes);
        console.log("[managers2.insert] lastID:", this.lastID);

        resolve({
          changes: this.changes,
          lastID: this.lastID,
        });
      });
    });
  },

  /**
   * 既存があれば更新、なければ登録
   */
  upsert(data) {
    const {
      children_id,
      facility_id,
      staff_id,
      day_of_week_id,
      priority = 0,
      support_start_time = null,
      support_end_time = null,
    } = data;

    console.log("[managers2.upsert] input:", data);

    if (
      isEmpty(children_id) ||
      isEmpty(facility_id) ||
      isEmpty(staff_id) ||
      isEmpty(day_of_week_id)
    ) {
      return Promise.reject(
        new Error(
          "[managers2.upsert] children_id, facility_id, staff_id, day_of_week_id は必須です"
        )
      );
    }

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        INSERT INTO managers2 (
          children_id,
          facility_id,
          staff_id,
          day_of_week_id,
          priority,
          support_start_time,
          support_end_time
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (
          children_id,
          facility_id,
          staff_id,
          day_of_week_id
        )
        DO UPDATE SET
          priority = excluded.priority,
          support_start_time = excluded.support_start_time,
          support_end_time = excluded.support_end_time;
      `;

      const params = [
        children_id,
        facility_id,
        staff_id,
        day_of_week_id,
        priority,
        support_start_time,
        support_end_time,
      ];

      console.log("[managers2.upsert] SQL:", sql);
      console.log("[managers2.upsert] params:", params);

      db.run(sql, params, function (err) {
        db.close();

        if (err) {
          console.error("[managers2.upsert] ERROR:", err);
          return reject(err);
        }

        console.log("[managers2.upsert] changes:", this.changes);
        console.log("[managers2.upsert] lastID:", this.lastID);

        resolve({
          changes: this.changes,
          lastID: this.lastID,
        });
      });
    });
  },

  update(data) {
    const {
      children_id,
      facility_id,
      staff_id,
      day_of_week_id,

      old_children_id = children_id,
      old_facility_id = facility_id,
      old_staff_id = staff_id,
      old_day_of_week_id = day_of_week_id,

      priority = 0,
      support_start_time = null,
      support_end_time = null,
    } = data;

    console.log("[managers2.update] input:", data);

    if (
      isEmpty(children_id) ||
      isEmpty(facility_id) ||
      isEmpty(staff_id) ||
      isEmpty(day_of_week_id) ||
      isEmpty(old_children_id) ||
      isEmpty(old_facility_id) ||
      isEmpty(old_staff_id) ||
      isEmpty(old_day_of_week_id)
    ) {
      return Promise.reject(
        new Error(
          "[managers2.update] children_id, facility_id, staff_id, day_of_week_id は必須です"
        )
      );
    }

    return new Promise((resolve, reject) => {
      const db = connect();

      const sql = `
        UPDATE managers2
        SET
          children_id = ?,
          facility_id = ?,
          staff_id = ?,
          day_of_week_id = ?,
          priority = ?,
          support_start_time = ?,
          support_end_time = ?
        WHERE
          children_id = ?
          AND facility_id = ?
          AND staff_id = ?
          AND day_of_week_id = ?;
      `;

      const params = [
        children_id,
        facility_id,
        staff_id,
        day_of_week_id,
        priority,
        support_start_time,
        support_end_time,

        old_children_id,
        old_facility_id,
        old_staff_id,
        old_day_of_week_id,
      ];

      console.log("[managers2.update] SQL:", sql);
      console.log("[managers2.update] params:", params);

      db.run(sql, params, function (err) {
        db.close();

        if (err) {
          console.error("[managers2.update] ERROR:", err);
          return reject(err);
        }

        console.log("[managers2.update] changes:", this.changes);
        resolve(this.changes);
      });
    });
  },

  delete(data) {
    const {
      children_id,
      facility_id,
      staff_id,
      day_of_week_id = null,
    } = data;

    console.log("[managers2.delete] input:", data);

    if (isEmpty(children_id) || isEmpty(facility_id) || isEmpty(staff_id)) {
      return Promise.reject(
        new Error(
          "[managers2.delete] children_id, facility_id, staff_id は必須です"
        )
      );
    }

    return new Promise((resolve, reject) => {
      const db = connect();

      let sql;
      let params;

      if (!isEmpty(day_of_week_id)) {
        // 単一曜日削除
        sql = `
          DELETE FROM managers2
          WHERE children_id = ?
            AND facility_id = ?
            AND staff_id = ?
            AND day_of_week_id = ?;
        `;

        params = [
          children_id,
          facility_id,
          staff_id,
          day_of_week_id,
        ];
      } else {
        // 指定児童 + 指定施設 + 指定スタッフの全曜日削除
        sql = `
          DELETE FROM managers2
          WHERE children_id = ?
            AND facility_id = ?
            AND staff_id = ?;
        `;

        params = [
          children_id,
          facility_id,
          staff_id,
        ];
      }

      console.log("[managers2.delete] SQL:", sql);
      console.log("[managers2.delete] params:", params);

      db.run(sql, params, function (err) {
        db.close();

        if (err) {
          console.error("[managers2.delete] ERROR:", err);
          return reject(err);
        }

        console.log("[managers2.delete] changes:", this.changes);
        resolve(this.changes);
      });
    });
  },
};