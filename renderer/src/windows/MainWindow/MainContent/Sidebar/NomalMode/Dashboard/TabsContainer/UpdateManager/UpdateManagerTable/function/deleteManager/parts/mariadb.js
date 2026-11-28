// renderer/src/sql/useManager/deleteManager/parts/mariadb.js

export async function handleMariaDBDelete(payload) {
  void 0;
  void 0;

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
    await window.electronAPI.mariadb_managers2_delete({
      pk: ["children_id", "staff_id", "day_of_week_id","facility_id"],
      values: [children_id, staff_id, day_of_week_id,facility_id],
    });

    void 0;
    return true;

  } catch (error) {
    console.error("❌ MariaDB: managers2_delete エラー:", error);
    return false;

  } finally {
    void 0;
  }
}
