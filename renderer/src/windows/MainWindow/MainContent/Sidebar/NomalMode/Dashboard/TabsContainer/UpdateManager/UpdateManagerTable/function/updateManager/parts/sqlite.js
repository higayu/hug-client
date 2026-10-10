// renderer/src/sql/useManager/updateManager/parts/sqlite.js

/**
 * TIME型保存用に値を整形する
 *
 * 例:
 * - ""          -> null
 * - null        -> null
 * - "15:00"    -> "15:00:00"
 * - "15:00:00" -> "15:00:00"
 */
const formatTimeForDb = (value) => {
  if (value === "" || value == null) {
    return null;
  }

  const text = String(value).trim();

  if (!text) {
    return null;
  }

  // HH:mm の場合は HH:mm:00 にする
  if (/^\d{1,2}:\d{2}$/.test(text)) {
    const [hour, minute] = text.split(":");

    return `${String(Number(hour)).padStart(2, "0")}:${minute}:00`;
  }

  // HH:mm:ss の場合はそのまま。ただし時だけ0埋め
  if (/^\d{1,2}:\d{2}:\d{2}$/.test(text)) {
    const [hour, minute, second] = text.split(":");

    return `${String(Number(hour)).padStart(2, "0")}:${minute}:${second}`;
  }

  return text;
};

/**
 * 数値IDへ変換する
 */
const toNumberOrNull = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : null;
};

/**
 * SQLite managers2 更新
 *
 * managers2 主キー:
 * - facility_id
 * - children_id
 * - staff_id
 * - day_of_week_id
 *
 * 更新対象:
 * - priority
 * - support_start_time
 * - support_end_time
 */
export async function handleSQLiteUpdate(payload) {
  console.log("====== SQLite: handleSQLiteUpdate START ======");
  console.log("[handleSQLiteUpdate] 処理する担当:", payload);

  try {
    if (!payload || typeof payload !== "object") {
      console.error("[handleSQLiteUpdate] payload が不正です:", payload);
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
      console.error("[handleSQLiteUpdate] update payload 不正:", {
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

    /**
     * MariaDB側と同じ形
     */
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

    /**
     * SQLite側のIPCが旧形式を見ていても動かせるように、
     * pk / values / data と直接フィールドの両方を渡す。
     */
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

    console.log("[handleSQLiteUpdate] UPDATE args:", request);

    console.log(
      "[handleSQLiteUpdate] SQL preview:",
      `
      UPDATE managers2
      SET
        priority = ${data.priority},
        support_start_time = ${
          data.support_start_time == null
            ? "NULL"
            : `'${data.support_start_time}'`
        },
        support_end_time = ${
          data.support_end_time == null
            ? "NULL"
            : `'${data.support_end_time}'`
        }
      WHERE
        facility_id = ${values[0]}
        AND children_id = ${values[1]}
        AND staff_id = ${values[2]}
        AND day_of_week_id = ${values[3]};
      `
    );

    if (typeof window.electronAPI?.sqlite_managers2_update !== "function") {
      console.error(
        "[handleSQLiteUpdate] window.electronAPI.sqlite_managers2_update が未定義です"
      );

      return false;
    }

    const result = await window.electronAPI.sqlite_managers2_update(request);

    console.log("[handleSQLiteUpdate] sqlite_managers2_update result:", result);

    if (result === false) {
      console.error("❌ SQLite: managers2_update が false を返しました");
      return false;
    }

    if (result && typeof result === "object" && result.success === false) {
      console.error("❌ SQLite: managers2_update 失敗:", result);
      return false;
    }

    console.log("✅ SQLite: managers2_update 成功");
    return true;
  } catch (error) {
    console.error("❌ SQLite: managers2_update エラー:", error);
    return false;
  } finally {
    console.log("====== SQLite: handleSQLiteUpdate END ======");
  }
}