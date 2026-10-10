// renderer/src/sql/useManager/updateManager/parts/laravel.js

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

export async function handleLaravelUpdate(payload) {
  console.log("====== laravel: handleLaravel APIUpdate START ======");
  console.log("[handleLaravel APIUpdate] 処理する担当:", payload);

  try {
    if (!payload || typeof payload !== "object") {
      console.error("[handleLaravel APIUpdate] payload が不正です:", payload);
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
      is_active = 1,
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
      console.error("[handleLaravel APIUpdate] update payload 不正:", {
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
    const resolvedIsActive = Number(is_active) === 0 ? 0 : 1;

    const resolvedSupportStartTime = formatTimeForDb(support_start_time);
    const resolvedSupportEndTime = formatTimeForDb(support_end_time);

    // ★ 修正: 新しいAPIを使用
    if (typeof window.electronAPI?.laravel_procedure_upsertManagers2 !== "function") {
      console.error(
        "[handleLaravel APIUpdate] window.electronAPI.laravel_procedure_upsertManagers2 が未定義です"
      );
      return false;
    }

    const request = {
      children_id: resolvedChildrenId,
      facility_id: resolvedFacilityId,
      staff_id: resolvedStaffId,
      day_of_week_id: resolvedDayOfWeekId,
      priority: resolvedPriority,
      is_active: resolvedIsActive,
      support_start_time: resolvedSupportStartTime,
      support_end_time: resolvedSupportEndTime,
    };

    console.log("[handleLaravel APIUpdate] UPDATE args:", request);

    // ★ 修正: 新しいAPIを呼び出し
    const result = await window.electronAPI.laravel_procedure_upsertManagers2(request);

    console.log("[handleLaravel APIUpdate] upsertManagers2 result:", result);

    if (result === false) {
      console.error("❌ laravel: upsertManagers2 が false を返しました");
      return false;
    }

    if (result && typeof result === "object" && result.success === false) {
      console.error("❌ laravel: upsertManagers2 失敗:", result);
      return false;
    }

    console.log("✅ laravel: upsertManagers2 成功");
    return true;
  } catch (error) {
    console.error("❌ laravel: upsertManagers2 エラー:", error);
    return false;
  } finally {
    console.log("====== laravel: handleLaravel APIUpdate END ======");
  }
}
