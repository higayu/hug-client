// renderer/src/hooks/useDataBase/splitChildrenData/Experience_children_v/index.js

/**
 * DBの種類に応じて「体験児童（children_type_id = -1）」データを取得
 * @param {Object} params
 * @param {Object} params.tables - Laravel APIの全テーブル
 * @param {number|string|null} [params.facility_id] - 選択中の施設ID
 * @returns {Promise<Array>}
 */
export async function Experience_children_v({ tables, facility_id = null }) {
  try {
      if (!tables) {
        console.error("❌ Experience_children_v: テーブルデータが未定義です");
        return [];
      }

      const {
        children = [],
        pc = [],
        pc_to_children = [],
        facility_children = [],
      } = tables;

      const facilityIdText =
        facility_id == null || facility_id === "" ? null : String(facility_id);
      const facilityChildRows = facilityIdText === null
        ? facility_children
        : facility_children.filter(
            (row) => String(row.facility_id) === facilityIdText
          );
      const childIdsInFacility = new Set(
        facilityChildRows.map((row) => String(row.children_id))
      );

      const experienceChildren = children
        .filter(
          (c) =>
            Number(c.children_type_id) === -1 &&
            Number(c.is_delete) === 0 &&
            (facilityIdText === null || childIdsInFacility.has(String(c.id)))
        )
        .map((c) => {
          const ptc = pc_to_children.find((p) => p.children_id === c.id);
          const pcItem = ptc ? pc.find((p) => p.id === ptc.pc_id) : null;
          return {
            children_id: c.id,
            children_name: c.name,
            notes: c.notes || "",
            notes2: c.notes2 || "",
            personal_tmp: c.personal_tmp || "",
            is_delete: c.is_delete,
            pronunciation_id: c.pronunciation_id,
            children_type_id: c.children_type_id,
            leaving_at: c.leaving_at || null,
            pc_id: pcItem?.id || null,
            pc_name: pcItem?.name || "",
            explanation: pcItem?.explanation || "",
            memo: pcItem?.memo || "",
            facility_id:
              facilityChildRows.find(
                (row) => String(row.children_id) === String(c.id)
              )?.facility_id ?? null,
          };
        })
        .sort((a, b) => a.children_name.localeCompare(b.children_name, "ja"));

      void 0;
      return experienceChildren;

  } catch (error) {
    console.error("❌ Experience_children_v エラー:", error);
    return [];
  }
}
