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
  console.log("====== SQLite: handleSQLiteInsert START ======");
  console.log("処理する児童:", child);

  try {
    // -----------------------------------------
    // ID 正規化
    // -----------------------------------------
    const targetFacilityId = Number(facilityId ?? FACILITY_ID);
    const targetStaffId = Number(staffId ?? STAFF_ID);
    const targetWeekId = Number(weekId);
    const targetChildId = Number(child?.children_id);

    console.log("targetFacilityId:", targetFacilityId);
    console.log("targetStaffId:", targetStaffId);
    console.log("targetWeekId:", targetWeekId);
    console.log("targetChildId:", targetChildId);

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
    console.log("SQLite: children テーブル検索中...");

    const existingChild = childrenData?.find(
      (c) => String(c.id) === String(targetChildId)
    );

    console.log("SQLite: existingChild 結果:", existingChild);

    if (!existingChild) {
      console.log("SQLite: 児童が children テーブルに存在しません:", targetChildId);

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

      console.log("SQLite: children_insert 実行 →", childPayload);

      const result = await window.electronAPI.sqlite_children_insert(
        childPayload
      );

      console.log("SQLite: children_insert 完了:", result);

      const facilityPayload = {
        children_id: targetChildId,
        facility_id: targetFacilityId,
      };

      console.log("SQLite: facility_children_insert 実行 →", facilityPayload);

      const result2 = await window.electronAPI.sqlite_facility_children_insert(
        facilityPayload
      );

      console.log("SQLite: facility_children_insert 完了:", result2);
    } else {
      console.log("SQLite: 児童はすでに children テーブルに存在します:", existingChild);
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

    console.log("SQLite: managers2_insert 実行 →", managerPayload);

    const result3 = await window.electronAPI.sqlite_managers2_insert(
      managerPayload
    );

    console.log("SQLite: managers2_insert 完了:", result3);

    return true;
  } catch (error) {
    console.error("❌ SQLite: handleSQLiteInsert エラー:", error);
    return false;
  } finally {
    console.log("====== SQLite: handleSQLiteInsert END ======");
  }
}