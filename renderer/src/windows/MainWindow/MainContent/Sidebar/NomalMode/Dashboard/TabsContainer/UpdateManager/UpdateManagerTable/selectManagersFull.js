// renderer/src/components/Sidebar/Tools/UpdateManager/selectManagersFull.js

const toNumberOrNull = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

export function selectManagersFull(database = {}) {
  const managers2 = Array.isArray(database.managers2)
    ? database.managers2
    : [];

  const children = Array.isArray(database.children)
    ? database.children
    : [];

  const staffs = Array.isArray(database.staffs)
    ? database.staffs
    : [];

  const dayOfWeek = Array.isArray(database.day_of_week)
    ? database.day_of_week
    : [];

  const facilities = Array.isArray(database.facilities)
    ? database.facilities
    : Array.isArray(database.facility)
      ? database.facility
      : [];

  // ------------------------------------------
  // 検索用 Map を作る（高速）
  // ------------------------------------------
  const childrenMap = new Map(
    children
      .filter((c) => Number(c.is_delete ?? 0) === 0)
      .map((c) => [Number(c.id), c])
  );

  const staffMap = new Map(
    staffs.map((s) => [Number(s.id), s])
  );

  const dayMap = new Map(
    dayOfWeek.map((d) => [Number(d.id), d])
  );

  const facilityMap = new Map(
    facilities.map((f) => [Number(f.id), f])
  );

  // ------------------------------------------
  // managers2 + children + staffs + day_of_week を JOIN
  // SQL の INNER JOIN 相当
  //
  // facility_id は managers2 のキー条件に使うため必ず返す
  // facilities テーブルが database にある場合だけ facility_name も補完する
  // ------------------------------------------
  return managers2
    .map((m) => {
      const facilityId = toNumberOrNull(m.facility_id);
      const childrenId = toNumberOrNull(m.children_id);
      const staffId = toNumberOrNull(m.staff_id);
      const dayOfWeekId = toNumberOrNull(m.day_of_week_id);

      if (
        facilityId === null ||
        childrenId === null ||
        staffId === null ||
        dayOfWeekId === null
      ) {
        console.warn("[selectManagersFull] managers2 のIDが不正です:", m);
        return null;
      }

      const child = childrenMap.get(childrenId);
      const staff = staffMap.get(staffId);
      const day = dayMap.get(dayOfWeekId);
      const facility = facilityMap.get(facilityId);

      // JOIN 失敗は除外
      if (!child || !staff || !day) {
        return null;
      }

      return {
        // managers2
        facility_id: facilityId,
        children_id: childrenId,
        staff_id: staffId,
        day_of_week_id: dayOfWeekId,

        priority: Number(m.priority ?? 0),
        is_active: Number(m.is_active ?? 1),
        support_start_time: m.support_start_time ?? null,
        support_end_time: m.support_end_time ?? null,

        // children
        children_name: child.name ?? "",

        // staffs
        staff_name: staff.name ?? "",

        // facilities
        facility_name:
          facility?.name ??
          facility?.facility_name ??
          facility?.label ??
          "",

        // day_of_week
        day_of_week_label: day.label_jp ?? "",
        day_of_week_sort_order: Number(day.sort_order ?? 0),
      };
    })
    .filter(Boolean);
}
