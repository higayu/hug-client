// src/utils/managersUtils.js

/**
 * 空判定
 * 0 は有効値として扱う
 */
function isEmpty(value) {
  return value === undefined || value === null || value === "";
}

/**
 * 空の manager レコードを作る
 */
function createEmptyManagerRecord(childrenId, facilityId, staffId) {
  const record = {
    children_id: childrenId,
    staff_id: staffId,
    day_of_week: JSON.stringify({ days: [] }),
  };

  if (!isEmpty(facilityId)) {
    record.facility_id = facilityId;
  }

  return record;
}

/**
 * 特定の児童ID & 施設ID & スタッフID の manager レコードを取得
 *
 * 新形式:
 * getManagerRecord(childrenId, facilityId, staffId, managersList)
 *
 * 旧形式:
 * getManagerRecord(childrenId, staffId, managersList)
 *
 * 見つからない場合は day_of_week={"days":[]} を返す
 */
export const getManagerRecord = (...args) => {
  let childrenId;
  let facilityId;
  let staffId;
  let managersList;

  // 新形式: childrenId, facilityId, staffId, managersList
  if (args.length >= 4) {
    [childrenId, facilityId, staffId, managersList] = args;
  } else {
    // 旧形式: childrenId, staffId, managersList
    [childrenId, staffId, managersList] = args;
    facilityId = null;
  }

  if (!Array.isArray(managersList)) {
    return createEmptyManagerRecord(childrenId, facilityId, staffId);
  }

  const record = managersList.find((manager) => {
    const sameChild =
      Number(manager.children_id) === Number(childrenId);

    const sameStaff =
      Number(manager.staff_id) === Number(staffId);

    // facilityId が渡されている場合だけ施設も見る
    const sameFacility = isEmpty(facilityId)
      ? true
      : Number(manager.facility_id) === Number(facilityId);

    return sameChild && sameFacility && sameStaff;
  });

  if (!record) {
    return createEmptyManagerRecord(childrenId, facilityId, staffId);
  }

  return record;
};

/**
 * day_of_week JSON に曜日IDを追加して返す
 *
 * @param {string|object|null|undefined} weekDate
 * 例: '{"days":[2]}' または { days: [2] }
 *
 * @param {number|string} weekId
 * 追加したい曜日ID
 *
 * @returns {string}
 * 更新された JSON 文字列
 */
export const updateManager = (weekDate, weekId) => {
  const normalizedWeekId = Number(weekId);

  if (Number.isNaN(normalizedWeekId)) {
    return JSON.stringify({ days: [] });
  }

  if (!weekDate) {
    return JSON.stringify({ days: [normalizedWeekId] });
  }

  let parsed;

  try {
    parsed =
      typeof weekDate === "string"
        ? JSON.parse(weekDate)
        : { ...weekDate };
  } catch (error) {
    console.warn("[updateManager] day_of_week JSON parse failed:", {
      weekDate,
      error,
    });

    parsed = { days: [] };
  }

  if (!parsed || typeof parsed !== "object") {
    parsed = { days: [] };
  }

  if (!Array.isArray(parsed.days)) {
    parsed.days = [];
  }

  const normalizedDays = parsed.days
    .map((day) => Number(day))
    .filter((day) => !Number.isNaN(day));

  if (!normalizedDays.includes(normalizedWeekId)) {
    normalizedDays.push(normalizedWeekId);
  }

  normalizedDays.sort((a, b) => a - b);

  return JSON.stringify({
    ...parsed,
    days: normalizedDays,
  });
};