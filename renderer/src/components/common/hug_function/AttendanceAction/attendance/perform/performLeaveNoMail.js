/**
 * 退室（メール通知なし）。
 *
 * 動作確認済みの旧仕様をそのまま使用する。
 * WebAutomation Flow は通さず、HUG 側 onclick と画面行データから
 * data_list を組み立て、ajax/ajax_attendance.php へ直接 POST する。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { buildLeavePatchFromRow } from "../helpers/formHelpers.js";
import { taishitsuFromOnclickInWebview } from "../post/postAttendanceInWebview.js";

export const LEAVE_NO_MAIL_FLOW_KEY = "attendance_leave_no_mail";

export async function performLeaveNoMail(item, ctx = {}) {
  if (!item?.leaveOnclick) {
    throw new Error("退室 onclick がありません");
  }

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("退室 POST 用の HUG webview を取得できませんでした");
  }

  // 旧仕様: 行データから退室時刻等を補い、mail_flg=0 で直接 POST する。
  const patch = buildLeavePatchFromRow(item, { mail_flg: 0 });

  const postResult = await taishitsuFromOnclickInWebview(
    webview,
    item.leaveOnclick,
    patch
  );

  if (!postResult?.success) {
    throw new Error(
      postResult?.error || "退室（メール通知なし）POST に失敗しました"
    );
  }

  return {
    mode: "extension",
    flowKey: LEAVE_NO_MAIL_FLOW_KEY,
    ruleKey: null,
    mail_flg: 0,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: `退室を送信しました（メール通知なし / r_id=${postResult.dataList.r_id}）`,
  };
}
