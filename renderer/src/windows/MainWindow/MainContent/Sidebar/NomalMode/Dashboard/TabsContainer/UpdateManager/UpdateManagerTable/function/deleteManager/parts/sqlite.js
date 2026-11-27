// renderer/src/sql/useManager/deleteManager/parts/sqlite.js


export async function handleSQLiteDelete(
  child,
) {

  void 0;
  void 0;

    const result3 = await window.electronAPI.sqlite_managers2_delete({
      children_id: child.children_id,
      staff_id:child.staff_id,
      day_of_week_id:child.day_of_week_id,
      facility_id:child.facility_id,
    });

    void 0;
    void 0;
    return true;
}
