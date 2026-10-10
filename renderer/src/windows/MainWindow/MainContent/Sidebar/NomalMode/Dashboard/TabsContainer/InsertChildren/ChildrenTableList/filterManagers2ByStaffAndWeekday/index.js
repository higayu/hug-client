// renderer/src/components/Sidebar/Tools/InsertChildren/filterManagers2ByStaffAndWeekday.js

/**
 * managers2 から、指定施設ID・スタッフID・曜日IDに一致するレコードだけ抽出する
 *
 * @param {Array} managers2 managers2 の配列
 * @param {number|string} facilityId 施設ID
 * @param {number|string} staffId スタッフID
 * @param {number|string} weekdayId 曜日ID
 * @returns {Array}
 */
export function filterManagers2ByFacilityStaffAndWeekday(
  managers2,
  facilityId,
  staffId,
  weekdayId
) {
  if (!Array.isArray(managers2)) {
    return [];
  }

  const targetFacilityId = Number(facilityId);
  const targetStaffId = Number(staffId);
  const targetWeekdayId = Number(weekdayId);

  if (
    !Number.isFinite(targetFacilityId) ||
    !Number.isFinite(targetStaffId) ||
    !Number.isFinite(targetWeekdayId)
  ) {
    console.warn("[filterManagers2ByFacilityStaffAndWeekday] 引数が不正です", {
      facilityId,
      staffId,
      weekdayId,
      targetFacilityId,
      targetStaffId,
      targetWeekdayId,
    });

    return [];
  }

  return managers2.filter((manager) => {
    return (
      Number(manager?.facility_id) === targetFacilityId &&
      Number(manager?.staff_id) === targetStaffId &&
      Number(manager?.day_of_week_id) === targetWeekdayId
    );
  });
}

/**
 * 抽出結果から children_id だけを Set で返す
 * 次段階の「登録済み判定」に使える
 *
 * @param {Array} managers2 managers2 の配列
 * @param {number|string} facilityId 施設ID
 * @param {number|string} staffId スタッフID
 * @param {number|string} weekdayId 曜日ID
 * @returns {Set<number>}
 */
export function getManagedChildrenIdSetByFacilityStaffAndWeekday(
  managers2,
  facilityId,
  staffId,
  weekdayId
) {
  const filtered = filterManagers2ByFacilityStaffAndWeekday(
    managers2,
    facilityId,
    staffId,
    weekdayId
  );

  return new Set(
    filtered
      .map((manager) => Number(manager?.children_id))
      .filter((id) => Number.isFinite(id))
  );
}

/**
 * 旧関数名との互換用
 *
 * facility_id 追加後は facilityId を渡せる場合、
 * filterManagers2ByFacilityStaffAndWeekday を使ってください。
 *
 * @deprecated facility_id 条件がないため、新規コードでは使用しない
 */
export function filterManagers2ByStaffAndWeekday(
  managers2,
  staffId,
  weekdayId
) {
  if (!Array.isArray(managers2)) {
    return [];
  }

  const targetStaffId = Number(staffId);
  const targetWeekdayId = Number(weekdayId);

  if (!Number.isFinite(targetStaffId) || !Number.isFinite(targetWeekdayId)) {
    console.warn("[filterManagers2ByStaffAndWeekday] 引数が不正です", {
      staffId,
      weekdayId,
      targetStaffId,
      targetWeekdayId,
    });

    return [];
  }

  return managers2.filter((manager) => {
    return (
      Number(manager?.staff_id) === targetStaffId &&
      Number(manager?.day_of_week_id) === targetWeekdayId
    );
  });
}

/**
 * 旧関数名との互換用
 *
 * @deprecated facility_id 条件がないため、新規コードでは使用しない
 */
export function getManagedChildrenIdSetByStaffAndWeekday(
  managers2,
  staffId,
  weekdayId
) {
  const filtered = filterManagers2ByStaffAndWeekday(
    managers2,
    staffId,
    weekdayId
  );

  return new Set(
    filtered
      .map((manager) => Number(manager?.children_id))
      .filter((id) => Number.isFinite(id))
  );
}