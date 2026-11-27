// renderer/src/AppStateContent/splitChildrenData/index.js
// 
import { GetchildrenByStaffAndDay } from "./GetchildrenByStaffAndDay";
import { Get_waiting_children_pc } from "./Get_waiting_children_pc";
import { Experience_children_v } from "./Experience_children_v";

/**
 * 子どもデータを包括的に取得する（週／待機／体験）
 * @param {Object} params
 * @param {Object} params.tables - Laravel APIの全テーブルデータ
 * @param {number|string} params.staffId - スタッフID
 * @param {number} params.weekdayId - 日付または曜日
 * @param {number|string|null} [params.facility_id] - 施設ID（省略可）
 * @returns {Promise<{ week_children:Array, waiting_children:Array, Experience_children:Array }>}
 */
export async function splitChildrenData({ tables, staffId, weekdayId, facility_id = null }) {
  
  let myChildren = [];
  let myWaitingChildren = [];
  let myExperienceChildren = [];

  void 0;

    // 各種データ取得
    myChildren = await GetchildrenByStaffAndDay({
      tables,
      staffId,
      weekdayId,
      facility_id,
    });

    myWaitingChildren = await Get_waiting_children_pc({ tables, facility_id });
    myExperienceChildren = await Experience_children_v({ tables, facility_id });

    void 0;

    void 0;
    void 0;
    void 0;

  return {
    week_children: myChildren,
    waiting_children: myWaitingChildren,
    Experience_children: myExperienceChildren,
  };
}
