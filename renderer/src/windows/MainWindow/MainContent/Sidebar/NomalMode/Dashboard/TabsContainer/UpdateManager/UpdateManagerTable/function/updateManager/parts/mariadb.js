// renderer/src/sql/useManager/updateManager/parts/mariadb.js

const formatTimeForDb = (value) => {
  if (value === "" || value == null) {
    return null;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hour, minute] = text.split(":");

    return `${String(Number(hour)).padStart(2, "0")}:${minute}:00`;
  }

  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) {
    const [hour, minute, second] = text.split(":");

    return `${String(Number(hour)).padStart(2, "0")}:${minute}:${second}`;
  }

  return text;
};

const toNumberOrNull = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

export async function handleMariaDBUpdate(payload) {
  void 0;
  void 0;

  try {
    if (!payload || typeof payload !== "object") {
      console.error("[handleMariaDBUpdate] payload が不正です:", payload);
      return false;
    }

    const {
      facility_id,
      facilityId,
      FACILITY_ID,
      children_id,
      staff_id,
      day_of_week_id,
      priority = 0,
      support_start_time = null,
      support_end_time = null,
    } = payload;

    const resolvedFacilityId = toNumberOrNull(
      facility_id ?? facilityId ?? FACILITY_ID
    );
    const resolvedChildrenId = toNumberOrNull(children_id);
    const resolvedStaffId = toNumberOrNull(staff_id);
    const resolvedDayOfWeekId = toNumberOrNull(day_of_week_id);

    if (
      resolvedFacilityId === null ||
      resolvedChildrenId === null ||
      resolvedStaffId === null ||
      resolvedDayOfWeekId === null
    ) {
      console.error("[handleMariaDBUpdate] update payload 不正:", {
        payload,
        resolvedFacilityId,
        resolvedChildrenId,
        resolvedStaffId,
        resolvedDayOfWeekId,
      });

      return false;
    }

    const resolvedPriority = Number.isFinite(Number(priority))
      ? Number(priority)
      : 0;

    const resolvedSupportStartTime = formatTimeForDb(support_start_time);
    const resolvedSupportEndTime = formatTimeForDb(support_end_time);

    const pk = [
      "facility_id",
      "children_id",
      "staff_id",
      "day_of_week_id",
    ];

    const values = [
      resolvedFacilityId,
      resolvedChildrenId,
      resolvedStaffId,
      resolvedDayOfWeekId,
    ];

    const data = {
      priority: resolvedPriority,
      support_start_time: resolvedSupportStartTime,
      support_end_time: resolvedSupportEndTime,
    };

    const request = {
      pk,
      values,
      data,

      facility_id: resolvedFacilityId,
      children_id: resolvedChildrenId,
      staff_id: resolvedStaffId,
      day_of_week_id: resolvedDayOfWeekId,
      priority: resolvedPriority,
      support_start_time: resolvedSupportStartTime,
      support_end_time: resolvedSupportEndTime,
    };

    void 0;

    void 0;

    if (typeof window.electronAPI?.mariadb_managers2_update !== "function") {
      console.error(
        "[handleMariaDBUpdate] window.electronAPI.mariadb_managers2_update が未定義です"
      );

      return false;
    }

    const result = await window.electronAPI.mariadb_managers2_update(request);

    void 0;

    if (result === false) {
      console.error("❌ MariaDB: managers2_update が false を返しました");
      return false;
    }

    if (result && typeof result === "object" && result.success === false) {
      console.error("❌ MariaDB: managers2_update 失敗:", result);
      return false;
    }

    void 0;
    return true;
  } catch (error) {
    console.error("❌ MariaDB: managers2_update エラー:", error);
    return false;
  } finally {
    void 0;
  }
}