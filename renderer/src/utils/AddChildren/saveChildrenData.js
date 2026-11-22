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
    console.log('===== saveChildrenData START =====');

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

    console.log('DATABASE_TYPE:', DATABASE_TYPE);
    console.log('databaseType:', databaseType);
    console.log('appState.DATABASE_TYPE:', appState?.DATABASE_TYPE);
    console.log('resolvedDatabaseType:', resolvedDatabaseType);

    // =============================================================
    // 必須チェック
    // =============================================================
    if (!selectedChildren) {
      console.warn('⚠️ selectedChildren が指定されていません。');
      console.log('===== saveChildrenData END (no selectedChildren) =====');
      return false;
    }

    if (!STAFF_ID) {
      console.warn('⚠️ STAFF_ID が指定されていません。');
      console.log('===== saveChildrenData END (no STAFF_ID) =====');
      return false;
    }

    if (!FACILITY_ID) {
      console.warn('⚠️ FACILITY_ID が指定されていません。');
      console.log('===== saveChildrenData END (no FACILITY_ID) =====');
      return false;
    }

    if (!CURRENT_DAY_OF_WEEK?.weekdayId) {
      console.warn('⚠️ CURRENT_DAY_OF_WEEK.weekdayId が取得できません。');
      console.log('===== saveChildrenData END (no weekdayId) =====');
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
      console.log('===== saveChildrenData END (empty selectedChildren) =====');
      return false;
    }

    // =============================================================
    // DB処理関数を決定
    // =============================================================
    const dbHandler = Laravel APIFnc;
    const dbLabel = resolvedDatabaseType;

    console.log('使用DB:', dbLabel);
    console.log('選択児童数:', childrenList.length);

    // =============================================================
    // 登録処理
    // =============================================================
    for (const child of childrenList) {
      if (!child?.children_id) {
        console.warn('⚠️ children_id がないためスキップします:', child);
        continue;
      }

      console.log('-------------------------------------------');
      console.log('▶ 児童データ登録開始:', {
        children_id: child.children_id,
        children_name: child.children_name,
        dbLabel,
      });

      await dbHandler({
        child,
        childrenData,
        managersData,
        STAFF_ID,
        CURRENT_DAY_OF_WEEK,
        FACILITY_ID,
      });

      console.log('✔ 児童データ登録完了:', child.children_id);
      console.log('-------------------------------------------');
    }

    console.log('✅ 全ての児童データ登録が完了しました。');
    console.log('===== saveChildrenData END (success) =====');

    return true;
  } catch (error) {
    console.error('❌ saveChildrenData エラー:', error);
    console.log('===== saveChildrenData END (failed) =====');
    return false;
  }
}
