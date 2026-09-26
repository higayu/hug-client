/**
 * 退室処理の振り分け。
 *
 * メール通知設定で処理を分離する。
 * - メールなし: 動作確認済み旧直接POST経路
 * - メールあり: attendance_leave_with_mail の新WebAutomation経路
 */

import { isLeaveMailEnabled } from "../helpers/mailDialog.js";
import { performLeaveNoMail } from "./performLeaveNoMail.js";
import { performLeaveWithMail } from "./performLeaveWithMail.js";
import { MailDialogCancelledError } from "../helpers/mailDialog.js";
import { NATIVE_STATUS_LEAVE } from "../update/nativeDelegateInWebview.js";

export async function performLeaveAction(item, ctx = {}) {
  if (!item?.leaveOnclick) {
    throw new Error("退室 onclick がありません");
  }

  if (isLeaveMailEnabled(item)) {
    return performLeaveWithMail(item, ctx);
  }

  return performLeaveNoMail(item, ctx);
}

export { MailDialogCancelledError, NATIVE_STATUS_LEAVE };
