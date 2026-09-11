/**
 * 入室 POST 実行。
 *
 * 重要:
 * - HUG 本体の #addtend_dialog_mail / native click には依存しない。
 * - メール通知確認は renderer document 上で完結させる。
 * - mail_flg を決定してから webview を取得するため、モーダル表示自体は
 *   webview の表示・読込状態に依存しない。
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import {
  isEnterMailEnabled,
  resolveMailFlgForPost,
  MailDialogCancelledError,
} from "../helpers/mailDialog.js";
import { nyushituInWebview } from "../post/postAttendanceInWebview.js";
import { NATIVE_STATUS_ENTER } from "../update/nativeDelegateInWebview.js";

/**
 * @param {object} item 拡張 attendanceList の1行相当
 * @param {{
 *   facilityId: string,
 *   dateStr: string,
 *   webview?: Electron.WebviewTag,
 *   mailFlg?: number,
 *   mail_flg?: number,
 *   skipMailPrompt?: boolean,
 * }} ctx
 */
export async function performEnterAction(item, ctx = {}) {
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

  const needsMailConfirmation = isEnterMailEnabled(item);
  let mail_flg = 0;

  if (needsMailConfirmation) {
    if (ctx.skipMailPrompt === true) {
      // React renderer の MailNotificationModal で選択済み。
      // HUG 本体モーダルや webview DOM は一切参照しない。
      mail_flg = Number(ctx.mailFlg ?? ctx.mail_flg ?? 0) === 1 ? 1 : 0;
    } else {
      // renderer UI 以外から直接呼ばれた場合も、renderer document 上の
      // 自前モーダルを使う。ここでも webview はまだ取得しない。
      mail_flg = await resolveMailFlgForPost(item, "enter");
    }
  }

  // 通知有無を決定した「後」で初めて Cache webview を取得する。
  // webview は認証済みセッションで ajax_attendance.php へ POST するためだけに使う。
  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("入室 POST 用の HUG webview を取得できませんでした");
  }

  const postResult = await nyushituInWebview(webview, item.enterOnclick, {
    mail_flg,
  });

  if (!postResult?.success) {
    throw new Error(postResult?.error || "入室 POST に失敗しました");
  }

  return {
    mode: needsMailConfirmation ? "renderer-mail" : "extension",
    mail_flg,
    success: true,
    dataList: postResult.dataList,
    json: postResult.json,
    statusMessage: needsMailConfirmation
      ? `入室を記録しました（r_id=${postResult.dataList.r_id} / mail_flg=${mail_flg}）`
      : `入室を記録しました（r_id=${postResult.dataList.r_id}）`,
  };
}

export { MailDialogCancelledError, NATIVE_STATUS_ENTER };
