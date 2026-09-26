/**
 * 入室（メール通知なし）。
 *
 * 動作確認済みの旧仕様をそのまま使用する。
 * WebAutomation Flow は通さず、HUG 側 onclick を解析して
 * ajax/ajax_attendance.php へ直接 POST する旧経路を維持する。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import { nyushituInWebview } from "../post/postAttendanceInWebview.js";

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

  // 旧仕様: onclick を解析し、mail_flg=0 で直接 POST する。
  const postResult = await nyushituInWebview(webview, item.enterOnclick, {
    mail_flg: 0,
  });

  if (!postResult?.success) {
    throw new Error(
      postResult?.error || "入室（メール通知なし）POST に失敗しました"
    );
  }

  return {
    mode: "extension",
    flowKey: ENTER_NO_MAIL_FLOW_KEY,
    ruleKey: null,
    mail_flg: 0,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: `入室を記録しました（メール通知なし / r_id=${postResult.dataList.r_id}）`,
  };
}
