// renderer/src/sql/useManager/deleteManager/parts/sqlite.js


export async function handleSQLiteDelete(
  child,
) {

  console.log("====== SQLite: handleSQLiteDelete START ======");
  console.log('削除データ',child);

    const result3 = await window.electronAPI.sqlite_managers2_delete({
      children_id: child.children_id,
      staff_id:child.staff_id,
      day_of_week_id:child.day_of_week_id,
      facility_id:child.facility_id,
    });

    console.log("SQLite: managers_delete 完了:", result3);
    console.log("====== SQLite: handleSQLiteDelete END ======");
    return true;
}
