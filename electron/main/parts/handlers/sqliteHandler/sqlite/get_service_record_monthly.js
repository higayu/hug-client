const { connect } = require("./base");

function normalizeParams(data = {}) {
  const targetMonth = String(data.target_month ?? "").trim();
  const dayOfWeekId = Number(data.day_of_week_id);
  const facilityId = Number(data.facility_id);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(targetMonth)) {
    throw new Error("target_monthはYYYY-MM形式で指定してください。");
  }

  if (!Number.isInteger(dayOfWeekId) || dayOfWeekId <= 0) {
    throw new Error("day_of_week_idが不正です。");
  }

  if (!Number.isInteger(facilityId) || facilityId <= 0) {
    throw new Error("facility_idが不正です。");
  }

  const [year, month] = targetMonth.split("-").map(Number);
  const nextMonthDate = new Date(Date.UTC(year, month, 1));
  const nextMonth = [
    nextMonthDate.getUTCFullYear(),
    String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0"),
  ].join("-");

  return {
    targetMonth,
    nextMonth,
    dayOfWeekId,
    facilityId,
  };
}

function all(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (error, rows) => {
      if (error) return reject(error);
      resolve(rows);
    });
  });
}

function close(db) {
  return new Promise((resolve, reject) => {
    db.close((error) => error ? reject(error) : resolve());
  });
}

async function getServiceRecordMonthly(data = {}) {
  const params = normalizeParams(data);
  const db = connect();

  try {
    return await all(
      db,
      `
        SELECT
          id, children_id, day_of_week_id, item_id, served_date,
          facility_id, note, is_copy, is_deleted, recorded_staff_id,
          created_at, updated_staff_id, updated_at
        FROM service_record
        WHERE item_id = 1
          AND day_of_week_id = ?
          AND facility_id = ?
          AND served_date >= ?
          AND served_date < ?
          AND is_deleted = 0
        ORDER BY served_date ASC, children_id ASC
      `,
      [
        params.dayOfWeekId,
        params.facilityId,
        `${params.targetMonth}-01`,
        `${params.nextMonth}-01`,
      ],
    );
  } finally {
    await close(db);
  }
}

module.exports = {
  normalizeParams,
  getServiceRecordMonthly,
};
