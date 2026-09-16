/**
 * 退室 POST 実行。
 *
 * 重要:
 * - メール通知確認は renderer の MailNotificationModal で完結させる。
 * - renderer で選択済みの場合は HUG 本体のメール確認ダイアログを開かない。
 * - mail_flg を確定した状態で ajax_attendance.php へ直接 POST する。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { buildLeavePatchFromRow } from "../helpers/formHelpers.js";
import {
  isLeaveMailEnabled,
  resolveMailFlgForPost,
  MailDialogCancelledError,
} from "../helpers/mailDialog.js";
import { taishitsuFromOnclickInWebview } from "../post/postAttendanceInWebview.js";
import { NATIVE_STATUS_LEAVE } from "../update/nativeDelegateInWebview.js";

/**
 * @param {object} item
 * @param {{
 *   facilityId: string,
 *   dateStr: string,
 *   webview?: Electron.WebviewTag,
 *   mailFlg?: number,
 *   mail_flg?: number,
 *   skipMailPrompt?: boolean,
 * }} ctx
 */
export async function performLeaveAction(item, ctx = {}) {
  if (!item?.leaveOnclick) {
    throw new Error("退室 onclick がありません");
  }

  const needsMailConfirmation = isLeaveMailEnabled(item);
  let mail_flg = 0;

  if (needsMailConfirmation) {
    if (ctx.skipMailPrompt === true) {
      // React renderer の MailNotificationModal で選択済み。
      mail_flg = Number(ctx.mailFlg ?? ctx.mail_flg ?? 0) === 1 ? 1 : 0;
    } else {
      // renderer UI 以外から直接呼ばれた場合の互換ルート。
      mail_flg = await resolveMailFlgForPost(item, "leave");
    }
  }

  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("退室 POST 用の HUG webview を取得できませんでした");
  }

  const patch = buildLeavePatchFromRow(item, { mail_flg });
  const postResult = await taishitsuFromOnclickInWebview(
    webview,
    item.leaveOnclick,
    patch
  );

  if (!postResult?.success) {
    throw new Error(postResult?.error || "退室 POST に失敗しました");
  }

  return {
    mode: needsMailConfirmation ? "renderer-mail" : "extension",
    mail_flg,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: needsMailConfirmation
      ? `退室を記録しました（r_id=${postResult.dataList.r_id} / mail_flg=${mail_flg}）`
      : `退室を記録しました（r_id=${postResult.dataList.r_id}）`,
  };
}

export { MailDialogCancelledError, NATIVE_STATUS_LEAVE };
