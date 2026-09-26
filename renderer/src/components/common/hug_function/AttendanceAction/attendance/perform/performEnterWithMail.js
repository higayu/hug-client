/**
 * 入室（メール通知あり設定）。
 *
 * 現在正常動作している新仕様を維持しつつ、DBキーだけ専用化する。
 * HUG 側 onclick の isMail=1 の場合のみここへ来る。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import { resolveMailFlgForPost } from "../helpers/mailDialog.js";
import { executeAttendancePostFlow } from "../flow/attendancePostFlow.js";

export const ENTER_WITH_MAIL_FLOW_KEY = "attendance_enter_with_mail";

export async function performEnterWithMail(item, ctx = {}) {
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

  let mail_flg;

  if (ctx.skipMailPrompt === true) {
    // React renderer の MailNotificationModal で選択済み。
    mail_flg = Number(ctx.mailFlg ?? ctx.mail_flg ?? 0) === 1 ? 1 : 0;
  } else {
    // renderer UI 以外から直接呼ばれた場合。
    mail_flg = await resolveMailFlgForPost(item, "enter");
  }

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("入室 POST 用の HUG webview を取得できませんでした");
  }

  const postResult = await executeAttendancePostFlow(webview, {
    flowKey: ENTER_WITH_MAIL_FLOW_KEY,
    action: "enter",
    item,
    mailFlg: mail_flg,
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
      postResult?.error || "入室（メール通知あり）POST に失敗しました"
    );
  }

  return {
    mode: postResult.mode || "renderer-mail",
    flowKey: postResult.flow?.flow_key || ENTER_WITH_MAIL_FLOW_KEY,
    ruleKey: postResult.rule?.rule_key || null,
    mail_flg,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: `入室を記録しました（メール通知設定あり / r_id=${postResult.dataList.r_id} / mail_flg=${mail_flg}）`,
  };
}
