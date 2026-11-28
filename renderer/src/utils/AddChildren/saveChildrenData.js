import { Laravel APIFnc } from './Laravel APIFnc.js';

/**
 * 児童・施設・担当スタッフの登録をまとめて実行
 *
 * 方針:
 * - activeApi は使わない
 * - appState上のAPIオブジェクトは使わない
 * - DATABASE_TYPE を正本として DB 処理を分岐する
 *
 * @param {Object} params
 * @param {Array|Object} params.selectedChildren 選択された児童、または児童配列
 * @param {Object} [params.appState] Redux由来のappState。DATABASE_TYPEのfallback用
 * @param {Array} params.childrenData 子どもデータ
 * @param {Array} params.managersData 担当スタッフデータ
 * @param {string|number} params.STAFF_ID スタッフID
 * @param {Object} params.CURRENT_DAY_OF_WEEK 現在の曜日情報
 * @param {string|number} params.FACILITY_ID 施設ID
 * @param {string} [params.DATABASE_TYPE] "laravel"
 * @param {string} [params.databaseType] "laravel"
 * @returns {Promise<boolean>} 成功なら true
 */
export async function saveChildrenData({
  selectedChildren,
  appState,
  childrenData,
  managersData,
  STAFF_ID,
  CURRENT_DAY_OF_WEEK,
  FACILITY_ID,
  DATABASE_TYPE,
  databaseType,
}) {
  try {
    void 0;

    // =============================================================
    // DB種別を DATABASE_TYPE に統一
    // 優先順位:
    // 1. DATABASE_TYPE
    // 2. databaseType
    // 3. appState.DATABASE_TYPE
    // 4. laravel
    // =============================================================
    const rawDatabaseType =
      DATABASE_TYPE ||
      databaseType ||
      appState?.DATABASE_TYPE ||
      'laravel';

    const resolvedDatabaseType = rawDatabaseType;

    void 0;
    void 0;
    void 0;
    void 0;

    // =============================================================
    // 必須チェック
    // =============================================================
    if (!selectedChildren) {
      console.warn('⚠️ selectedChildren が指定されていません。');
      void 0;
      return false;
    }

    if (!STAFF_ID) {
      console.warn('⚠️ STAFF_ID が指定されていません。');
      void 0;
      return false;
    }

    if (!FACILITY_ID) {
      console.warn('⚠️ FACILITY_ID が指定されていません。');
      void 0;
      return false;
    }

    if (!CURRENT_DAY_OF_WEEK?.weekdayId) {
      console.warn('⚠️ CURRENT_DAY_OF_WEEK.weekdayId が取得できません。');
      void 0;
      return false;
    }

    // =============================================================
    // 単一オブジェクトなら配列化
    // =============================================================
    const childrenList = Array.isArray(selectedChildren)
      ? selectedChildren
      : [selectedChildren];

    if (childrenList.length === 0) {
      console.warn('⚠️ selectedChildren が空配列です。');
      void 0;
      return false;
    }

    // =============================================================
    // DB処理関数を決定
    // =============================================================
    const dbHandler = Laravel APIFnc;
    const dbLabel = resolvedDatabaseType;

    void 0;
    void 0;

    // =============================================================
    // 登録処理
    // =============================================================
    for (const child of childrenList) {
      if (!child?.children_id) {
        console.warn('⚠️ children_id がないためスキップします:', child);
        continue;
      }

      void 0;
      void 0;

      await dbHandler({
        child,
        childrenData,
        managersData,
        STAFF_ID,
        CURRENT_DAY_OF_WEEK,
        FACILITY_ID,
      });

      void 0;
      void 0;
    }

    void 0;
    void 0;

    return true;
  } catch (error) {
    console.error('❌ saveChildrenData エラー:', error);
    void 0;
    return false;
  }
}
