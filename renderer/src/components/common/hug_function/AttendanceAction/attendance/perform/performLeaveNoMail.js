/**
 * 退室（メール通知なし）。
 *
 * DB の web_automation_flows / web_automation_flow_steps /
 * web_automation_rules に保存された attendance_leave_no_mail を取得し、
 * DB 定義に従って HUG の退室 POST を実行する。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { buildLeavePatchFromRow } from "../helpers/formHelpers.js";
import { executeAttendancePostFlow } from "../flow/attendancePostFlow.js";

export const LEAVE_NO_MAIL_FLOW_KEY = "attendance_leave_no_mail";

export async function performLeaveNoMail(item, ctx = {}) {
  if (!item?.leaveOnclick) {
    throw new Error("退室 onclick がありません");
  }

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("退室 POST 用の HUG webview を取得できませんでした");
  }

  // 退室時刻・利用時間など、画面行から算出する値は従来どおり renderer で補完し、
  // onclick の解析方法・POST定義は DB Flow / Rule に従う。
  const patch = buildLeavePatchFromRow(item, { mail_flg: 0 });

  const postResult = await executeAttendancePostFlow(webview, {
    flowKey: LEAVE_NO_MAIL_FLOW_KEY,
    action: "leave",
    item,
    mailFlg: 0,
    patch,
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
      postResult?.error || "退室（メール通知なし）POST に失敗しました"
    );
  }

  return {
    mode: postResult.mode || "web-automation-flow",
    flowKey: postResult.flow?.flow_key || LEAVE_NO_MAIL_FLOW_KEY,
    ruleKey: postResult.rule?.rule_key || null,
    mail_flg: 0,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: `退室を送信しました（メール通知なし / DB Flow / r_id=${postResult.dataList.r_id}）`,
  };
}
