// renderer/src/sql/useManager/updateManager/updateManager/index.js

import { handleLaravelUpdate } from "./parts/laravel.js";

/**
 * managers2 更新処理
 *
 * 対応形式:
 * 1. 単一 managers2 行
 * 2. EditModal から渡される { managers2: [...] } 形式
 * 3. 配列形式
 *
 * @param {Object|Object[]} selectedChildren 更新対象
 * @param {string} databaseType "laravel"
 * @returns {Promise<boolean>}
 */
export async function updateManager(selectedChildren, databaseType) {
  void 0;
  void 0;
  void 0;

  if (!databaseType) {
    console.warn("⚠️ databaseType が設定されていません");
    void 0;
    return false;
  }

  const resolvedDatabaseType = databaseType;
  const updateHandler = handleLaravelUpdate;
  const dbLabel = resolvedDatabaseType;

  try {
    // =============================================================
    // 更新対象を配列へ正規化
    // =============================================================
    const updateTargets = (() => {
      // EditModal から渡される形式
      if (Array.isArray(selectedChildren?.managers2)) {
        return selectedChildren.managers2.map((row) => ({
          ...row,

          // row 側に facility_id がない場合、親 payload から補完する
          facility_id:
            row.facility_id ??
            selectedChildren.facility_id ??
            selectedChildren.facilityId ??
            selectedChildren.FACILITY_ID,

          children_id:
            row.children_id ??
            selectedChildren.children_id,

          staff_id:
            row.staff_id ??
            selectedChildren.staff_id,
        }));
      }

      // 配列形式
      if (Array.isArray(selectedChildren)) {
        return selectedChildren;
      }

      // 単一行
      if (selectedChildren && typeof selectedChildren === "object") {
        return [selectedChildren];
      }

      return [];
    })();

    if (updateTargets.length === 0) {
      console.warn("⚠️ 更新対象がありません");
      void 0;
      return false;
    }

    void 0;
    void 0;
    void 0;

    // =============================================================
    // 1件ずつ更新
    // =============================================================
    for (const target of updateTargets) {
      void 0;
      void 0;

      const result = await updateHandler(target);

      if (!result) {
        console.error("❌ managers2 更新失敗:", target);
        void 0;
        return false;
      }

      void 0;
      void 0;
    }

    void 0;
    return true;
  } catch (error) {
    console.error("❌ updateManager エラー:", error);
    void 0;
    return false;
  }
}
