/**
 * 退室（メール通知あり設定）。
 *
 * メール通知あり退室専用。
 * DB側も attendance_leave_with_mail として独立管理する。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { buildLeavePatchFromRow } from "../helpers/formHelpers.js";
import { resolveMailFlgForPost } from "../helpers/mailDialog.js";
import { executeAttendancePostFlow } from "../flow/attendancePostFlow.js";

export const LEAVE_WITH_MAIL_FLOW_KEY = "attendance_leave_with_mail";

export async function performLeaveWithMail(item, ctx = {}) {
  if (!item?.leaveOnclick) {
    throw new Error("退室 onclick がありません");
  }

  let mail_flg;

  if (ctx.skipMailPrompt === true) {
    // React renderer の MailNotificationModal で選択済み。
    mail_flg = Number(ctx.mailFlg ?? ctx.mail_flg ?? 0) === 1 ? 1 : 0;
  } else {
    mail_flg = await resolveMailFlgForPost(item, "leave");
  }

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("退室 POST 用の HUG webview を取得できませんでした");
  }

  const patch = buildLeavePatchFromRow(item, { mail_flg });

  const postResult = await executeAttendancePostFlow(webview, {
    flowKey: LEAVE_WITH_MAIL_FLOW_KEY,
    action: "leave",
    item,
    mailFlg: mail_flg,
    patch,
    variables: {
      childId: item.childId || item.children_id || item.c_id,
      facilityId: ctx.facilityId || item.facilityId || item.f_id,
      date: ctx.dateStr || item.detailPageDate || item.date,
      dateStr: ctx.dateStr || item.detailPageDate || item.date,
      isMail: 1,
      mailFlg: mail_flg,
      mail_flg,
    },
  });

  if (!postResult?.success) {
    throw new Error(
      postResult?.error || "退室（メール通知あり）POST に失敗しました"
    );
  }

  return {
    mode: postResult.mode || "renderer-mail",
    flowKey: postResult.flow?.flow_key || LEAVE_WITH_MAIL_FLOW_KEY,
    ruleKey: postResult.rule?.rule_key || null,
    mail_flg,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: `退室を送信しました（メール通知設定あり / r_id=${postResult.dataList.r_id} / mail_flg=${mail_flg}）`,
  };
}
