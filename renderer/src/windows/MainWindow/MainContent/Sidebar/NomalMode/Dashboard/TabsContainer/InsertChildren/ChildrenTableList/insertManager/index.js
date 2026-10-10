// renderer/src/sql/useManager/insertManager/insertManager.js

import { handleSQLiteInsert } from "./parts/sqlite.js";
import { handleMariaDBInsert } from "./parts/mariadb.js";
import { handleLaravelInsert } from "./parts/laravel.js";

/**
 * 児童の managers2 登録処理
 *
 * 方針:
 * - activeApi は使わない
 * - Redux / AppState の DATABASE_TYPE を呼び出し元から databaseType として受け取る
 * - databaseType に応じて SQLite / MariaDB / Laravel の処理を分岐する
 * - managers2 に facility_id が追加されたため、施設IDも必須条件として扱う
 *
 * @param {Object|Object[]} selectedChildren 選択された児童、または児童配列
 * @param {Object} params
 * @param {Array} params.childrenData 子どもデータ
 * @param {Array} params.managersData managers2 データ
 * @param {string} params.databaseType "sqlite" | "mariadb" | "laravel"
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
  console.log("===== insertManager START =====");
  console.log("🔥 CURRENT_DAY_OF_WEEK:", CURRENT_DAY_OF_WEEK);

  try {
    // =============================================================
    // databaseType チェック・正規化
    // =============================================================
    if (!databaseType) {
      console.warn("⚠️ databaseType が設定されていません");
      console.log("===== insertManager END (error: no databaseType) =====");
      return false;
    }

    const resolvedDatabaseType = String(databaseType).trim().toLowerCase();

    const handlers = {
      sqlite: {
        handler: handleSQLiteInsert,
        label: "SQLite",
      },
      mariadb: {
        handler: handleMariaDBInsert,
        label: "MariaDB",
      },
      laravel: {
        handler: handleLaravelInsert,
        label: "Laravel",
      },
    };

    const selectedHandler = handlers[resolvedDatabaseType];

    if (!selectedHandler) {
      console.warn("⚠️ 不明な databaseType:", databaseType);
      return false;
    }

    console.log("databaseType:", databaseType);
    console.log("resolvedDatabaseType:", resolvedDatabaseType);

    // =============================================================
    // ID 正規化
    // =============================================================
    const facilityId = Number(FACILITY_ID);
    const staffId = Number(STAFF_ID);
    const weekId = Number(CURRENT_DAY_OF_WEEK?.weekdayId);

    console.log("FACILITY_ID:", FACILITY_ID, "→ facilityId:", facilityId);
    console.log("STAFF_ID:", STAFF_ID, "→ staffId:", staffId);
    console.log("weekdayId:", CURRENT_DAY_OF_WEEK?.weekdayId, "→ weekId:", weekId);

    // =============================================================
    // 必須値チェック
    // =============================================================
    if (!Number.isFinite(facilityId)) {
      console.warn("⚠️ FACILITY_ID が不正です", {
        FACILITY_ID,
        facilityId,
      });
      console.log("===== insertManager END (error: invalid FACILITY_ID) =====");
      return false;
    }

    if (!Number.isFinite(staffId)) {
      console.warn("⚠️ STAFF_ID が不正です", {
        STAFF_ID,
        staffId,
      });
      console.log("===== insertManager END (error: invalid STAFF_ID) =====");
      return false;
    }

    if (!Number.isFinite(weekId)) {
      console.warn("⚠️ CURRENT_DAY_OF_WEEK.weekdayId が取得できません", {
        CURRENT_DAY_OF_WEEK,
        weekId,
      });
      console.log("===== insertManager END (error: invalid weekdayId) =====");
      return false;
    }

    if (!selectedChildren) {
      console.warn("⚠️ selectedChildren が空です");
      console.log("===== insertManager END (error: no selectedChildren) =====");
      return false;
    }

    // 単一オブジェクトなら配列に変換
    const childrenList = Array.isArray(selectedChildren)
      ? selectedChildren
      : [selectedChildren];

    if (childrenList.length === 0) {
      console.warn("⚠️ 選択された児童がありません");
      console.log("===== insertManager END (error: empty childrenList) =====");
      return false;
    }

    console.log("選択された児童数:", childrenList.length);
    console.log("施設ID:", facilityId);
    console.log("スタッフID:", staffId);
    console.log("曜日ID:", weekId);

    // =============================================================
    // DB種別ごとの処理関数を決定
    // =============================================================
    const insertHandler = selectedHandler.handler;
    const dbLabel = selectedHandler.label;

    // =============================================================
    // 児童ごとに登録処理
    // =============================================================
    for (const child of childrenList) {
      console.log("-------------------------------------------");
      console.log("▶ 児童処理開始:", child?.children_id, child?.children_name);
      console.log("→ 使用DB:", dbLabel);

      const childId = Number(child?.children_id);

      if (!Number.isFinite(childId)) {
        console.warn("⚠️ children_id が不正なため、この児童をスキップします:", {
          child,
          childId,
        });
        console.log("▶ 児童処理スキップ");
        console.log("-------------------------------------------");
        continue;
      }

      const result = await insertHandler(child, {
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

      if (!result) {
        console.error(`❌ ${dbLabel} 処理失敗:`, childId);
        return false;
      }

      console.log(`✔ ${dbLabel} 処理完了:`, childId);
      console.log("▶ 児童処理終了:", childId);
      console.log("-------------------------------------------");
    }

    console.log("===== insertManager END (success) =====");
    return true;
  } catch (err) {
    console.error("❌ insertManager エラー:", err);
    console.log("===== insertManager END (failed) =====");
    return false;
  }
}
