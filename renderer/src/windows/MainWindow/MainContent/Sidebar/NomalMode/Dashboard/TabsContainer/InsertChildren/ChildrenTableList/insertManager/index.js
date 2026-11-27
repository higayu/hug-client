// renderer/src/sql/useManager/insertManager/insertManager.js

import { handleLaravelInsert } from "./parts/laravel.js";

/**
 * 児童の managers2 登録処理
 *
 * 方針:
 * - activeApi は使わない
 * - Redux / AppState の DATABASE_TYPE を呼び出し元から databaseType として受け取る
 * - Laravel APIで処理する
 * - managers2 に facility_id が追加されたため、施設IDも必須条件として扱う
 *
 * @param {Object|Object[]} selectedChildren 選択された児童、または児童配列
 * @param {Object} params
 * @param {Array} params.childrenData 子どもデータ
 * @param {Array} params.managersData managers2 データ
 * @param {string} params.databaseType "laravel"
 * @param {string|number} params.FACILITY_ID 施設ID
 * @param {string|number} params.STAFF_ID スタッフID
 * @param {Object} params.CURRENT_DAY_OF_WEEK 現在の曜日情報
 * @returns {Promise<boolean>} 成功なら true
 */
export async function insertManager(
  selectedChildren,
  {
    childrenData,
    managersData,
    databaseType,
    FACILITY_ID,
    STAFF_ID,
    CURRENT_DAY_OF_WEEK,
  }
) {
  void 0;
  void 0;

  try {
    // =============================================================
    // databaseType チェック・正規化
    // =============================================================
    if (!databaseType) {
      console.warn("⚠️ databaseType が設定されていません");
      void 0;
      return false;
    }

    if (String(databaseType).toLowerCase() !== "laravel") {
      console.warn("register_manager_assignment is available only through Laravel.");
      return false;
    }

    const resolvedDatabaseType = databaseType;

    void 0;
    void 0;

    // =============================================================
    // ID 正規化
    // =============================================================
    const facilityId = Number(FACILITY_ID);
    const staffId = Number(STAFF_ID);
    const weekId = Number(CURRENT_DAY_OF_WEEK?.weekdayId);

    void 0;
    void 0;
    void 0;

    // =============================================================
    // 必須値チェック
    // =============================================================
    if (!Number.isInteger(facilityId) || facilityId <= 0) {
      console.warn("⚠️ FACILITY_ID が不正です", {
        FACILITY_ID,
        facilityId,
      });
      void 0;
      return false;
    }

    if (!Number.isInteger(staffId) || staffId <= 0) {
      console.warn("⚠️ STAFF_ID が不正です", {
        STAFF_ID,
        staffId,
      });
      void 0;
      return false;
    }

    if (!Number.isInteger(weekId) || weekId <= 0 || weekId > 127) {
      console.warn("⚠️ CURRENT_DAY_OF_WEEK.weekdayId が取得できません", {
        CURRENT_DAY_OF_WEEK,
        weekId,
      });
      void 0;
      return false;
    }

    if (!selectedChildren) {
      console.warn("⚠️ selectedChildren が空です");
      void 0;
      return false;
    }

    // 単一オブジェクトなら配列に変換
    const childrenList = Array.isArray(selectedChildren)
      ? selectedChildren
      : [selectedChildren];

    if (childrenList.length === 0) {
      console.warn("⚠️ 選択された児童がありません");
      void 0;
      return false;
    }

    const invalidChild = childrenList.find((child) => {
      const childId = Number(child?.children_id);
      return !Number.isInteger(childId) || childId <= 0;
    });

    if (invalidChild) {
      console.warn("children_id must be a positive integer.", invalidChild);
      return false;
    }

    void 0;
    void 0;
    void 0;
    void 0;

    // =============================================================
    // DB種別ごとの処理関数を決定
    // =============================================================
    const insertHandler = handleLaravelInsert;
    const dbLabel = resolvedDatabaseType;

    // =============================================================
    // 児童ごとに登録処理
    // =============================================================
    for (const child of childrenList) {
      void 0;
      void 0;
      void 0;

      const childId = Number(child?.children_id);

      if (!Number.isInteger(childId) || childId <= 0) {
        console.warn("⚠️ children_id が不正なため、この児童をスキップします:", {
          child,
          childId,
        });
        void 0;
        void 0;
        continue;
      }

      await insertHandler(child, {
        childrenData,
        managersData,

        // 新しい推奨名
        facilityId,
        staffId,
        weekId,

        // 既存 handler 互換用
        FACILITY_ID: facilityId,
        STAFF_ID: staffId,
      });

      void 0;
      void 0;
      void 0;
    }

    void 0;
    return true;
  } catch (err) {
    console.error("❌ insertManager エラー:", err);
    void 0;
    return false;
  }
}
