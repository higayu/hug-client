// renderer/src/sql/useManager/insertManager/parts/mariadb.js

export async function handleMariaDBInsert(
  child,
  {
    childrenData,
    FACILITY_ID,
    STAFF_ID,

    // insertManager.js 側で追加した新しい名前にも対応
    facilityId,
    staffId,

    weekId,
    priority = 0,
  }
) {
  void 0;
  void 0;

  try {
    // -----------------------------------------
    // ID 正規化
    // -----------------------------------------
    const targetFacilityId = Number(facilityId ?? FACILITY_ID);
    const targetStaffId = Number(staffId ?? STAFF_ID);
    const targetWeekId = Number(weekId);
    const targetChildId = Number(child?.children_id);

    void 0;
    void 0;
    void 0;
    void 0;

    if (!Number.isFinite(targetFacilityId)) {
      console.warn("⚠️ MariaDB: facility_id が不正です", {
        facilityId,
        FACILITY_ID,
        targetFacilityId,
      });
      return false;
    }

    if (!Number.isFinite(targetStaffId)) {
      console.warn("⚠️ MariaDB: staff_id が不正です", {
        staffId,
        STAFF_ID,
        targetStaffId,
      });
      return false;
    }

    if (!Number.isFinite(targetWeekId)) {
      console.warn("⚠️ MariaDB: day_of_week_id が不正です", {
        weekId,
        targetWeekId,
      });
      return false;
    }

    if (!Number.isFinite(targetChildId)) {
      console.warn("⚠️ MariaDB: children_id が不正です", {
        child,
        targetChildId,
      });
      return false;
    }

    // -----------------------------------------
    // ① children テーブル存在チェック（MariaDB）
    // -----------------------------------------
    const existingChild = childrenData?.find(
      (c) => String(c.id) === String(targetChildId)
    );

    if (!existingChild) {
      const childPayload = {
        id: targetChildId,
        name: child.children_name || "",
        notes: child.notes ?? null,
        notes2: child.notes2 ?? null,
        personal_tmp: child.personal_tmp ?? null,
        pronunciation_id: child.pronunciation_id ?? null,
        children_type_id: Number(child.children_type_id ?? 1),
        is_delete: Number(child.is_delete ?? 0),
        leaving_at: child.leaving_at ?? null,
      };

      void 0;

      await window.electronAPI.mariadb_children_insert(childPayload);

      void 0;

      const facilityPayload = {
        children_id: targetChildId,
        facility_id: targetFacilityId,
      };

      void 0;

      await window.electronAPI.mariadb_facility_children_insert(
        facilityPayload
      );

      void 0;
    } else {
      void 0;
    }

    // ----------------------------------
    // ② managers2 レコードを insert
    // ----------------------------------
    const payload = {
      facility_id: targetFacilityId,
      children_id: targetChildId,
      staff_id: targetStaffId,
      day_of_week_id: targetWeekId,

      // managers2
      priority: Number(child.priority ?? priority ?? 0),

      // 追加カラム
      // MariaDB 側は TIME 型想定
      // "09:00:00" / null を渡す
      support_start_time: child.support_start_time ?? null,
      support_end_time: child.support_end_time ?? null,
    };

    void 0;

    await window.electronAPI.mariadb_managers2_insert(payload);

    void 0;

    return true;
  } catch (error) {
    console.error("❌ MariaDB: managers2_insert エラー:", error);
    return false;
  } finally {
    void 0;
  }
}