// renderer/src/sql/useManager/insertManager/parts/sqlite.js

export async function handleSQLiteInsert(
  child,
  {
    childrenData,
    managersData,
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
      console.warn("⚠️ SQLite: facility_id が不正です", {
        facilityId,
        FACILITY_ID,
        targetFacilityId,
      });
      return false;
    }

    if (!Number.isFinite(targetStaffId)) {
      console.warn("⚠️ SQLite: staff_id が不正です", {
        staffId,
        STAFF_ID,
        targetStaffId,
      });
      return false;
    }

    if (!Number.isFinite(targetWeekId)) {
      console.warn("⚠️ SQLite: day_of_week_id が不正です", {
        weekId,
        targetWeekId,
      });
      return false;
    }

    if (!Number.isFinite(targetChildId)) {
      console.warn("⚠️ SQLite: children_id が不正です", {
        child,
        targetChildId,
      });
      return false;
    }

    // -----------------------------------------
    // ① children テーブルのチェック
    // -----------------------------------------
    void 0;

    const existingChild = childrenData?.find(
      (c) => String(c.id) === String(targetChildId)
    );

    void 0;

    if (!existingChild) {
      void 0;

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

      const result = await window.electronAPI.sqlite_children_insert(
        childPayload
      );

      void 0;

      const facilityPayload = {
        children_id: targetChildId,
        facility_id: targetFacilityId,
      };

      void 0;

      const result2 = await window.electronAPI.sqlite_facility_children_insert(
        facilityPayload
      );

      void 0;
    } else {
      void 0;
    }

    // -----------------------------------------
    // ② managers2 テーブルへ登録
    // -----------------------------------------
    const managerPayload = {
      facility_id: targetFacilityId,
      children_id: targetChildId,
      staff_id: targetStaffId,
      day_of_week_id: targetWeekId,

      // managers2
      priority: Number(child.priority ?? priority ?? 0),

      // 追加カラム
      // ConfirmModal 側で "09:00:00" の形式にして渡す
      // 未設定の場合は null
      support_start_time: child.support_start_time ?? null,
      support_end_time: child.support_end_time ?? null,
    };

    void 0;

    const result3 = await window.electronAPI.sqlite_managers2_insert(
      managerPayload
    );

    void 0;

    return true;
  } catch (error) {
    console.error("❌ SQLite: handleSQLiteInsert エラー:", error);
    return false;
  } finally {
    void 0;
  }
}