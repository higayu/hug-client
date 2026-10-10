// renderer/src/sql/useManager/deleteManager/parts/Laravel API.js

export async function handleLaravelDelete(payload) {
  console.log("====== laravel: handleLaravel APIDelete START ======");
  console.log("処理する担当:", payload);

  try {
    const { children_id, staff_id, day_of_week_id,facility_id } = payload;

    if (
      children_id == null ||
      staff_id == null ||
      day_of_week_id == null
    ) {
      console.error("❌ delete payload 不正:", payload);
      return false;
    }

    // ✅ ★ここが唯一の正解
    await window.electronAPI.laravel_managers2_delete({
      pk: ["children_id", "staff_id", "day_of_week_id","facility_id"],
      values: [children_id, staff_id, day_of_week_id,facility_id],
    });

    console.log("✅ laravel: managers2_delete 成功");
    return true;

  } catch (error) {
    console.error("❌ laravel: managers2_delete エラー:", error);
    return false;

  } finally {
    console.log("====== laravel: handleLaravel APIDelete END ======");
  }
}
