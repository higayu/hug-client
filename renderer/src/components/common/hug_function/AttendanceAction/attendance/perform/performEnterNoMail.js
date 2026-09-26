/**
 * 入室（メール通知なし）。
 *
 * DB の web_automation_flows / web_automation_flow_steps /
 * web_automation_rules に保存された attendance_enter_no_mail を取得し、
 * DB 定義に従って HUG の入室 POST を実行する。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import { executeAttendancePostFlow } from "../flow/attendancePostFlow.js";

export const ENTER_NO_MAIL_FLOW_KEY = "attendance_enter_no_mail";

export async function performEnterNoMail(item, ctx = {}) {
  if (!item?.enterOnclick) {
    throw new Error("入室 onclick がありません");
  }

  if (
    isAfternoonEnterHeldUntilHalfTime(
      item.hugAlertPref || { amPmFlag: 0 },
      getHalfTime(),
      new Date()
    )
  ) {
    throw new Error(
      `午後枠のためハーフタイム（${getHalfTime()}）まで入室できません`
    );
  }

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("入室 POST 用の HUG webview を取得できませんでした");
  }

  const postResult = await executeAttendancePostFlow(webview, {
    flowKey: ENTER_NO_MAIL_FLOW_KEY,
    action: "enter",
    item,
    mailFlg: 0,
    variables: {
      childId: item.childId || item.children_id || item.c_id,
      facilityId: ctx.facilityId || item.facilityId || item.f_id,
      date: ctx.dateStr || item.detailPageDate || item.date,
      dateStr: ctx.dateStr || item.detailPageDate || item.date,
      isMail: 0,
      mailFlg: 0,
      mail_flg: 0,
    },
  });

  if (!postResult?.success) {
    throw new Error(
      postResult?.error || "入室（メール通知なし）POST に失敗しました"
    );
  }

  return {
    mode: postResult.mode || "web-automation-flow",
    flowKey: postResult.flow?.flow_key || ENTER_NO_MAIL_FLOW_KEY,
    ruleKey: postResult.rule?.rule_key || null,
    mail_flg: 0,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: `入室を記録しました（メール通知なし / DB Flow / r_id=${postResult.dataList.r_id}）`,
  };
}
