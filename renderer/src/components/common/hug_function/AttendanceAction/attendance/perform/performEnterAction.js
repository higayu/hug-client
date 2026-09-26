/**
 * 入室処理の振り分け。
 *
 * メール通知設定で処理を分離する。
 * - メールなし: 動作確認済み旧直接POST経路
 * - メールあり: attendance_enter_with_mail の新WebAutomation経路
 */

import { isEnterMailEnabled } from "../helpers/mailDialog.js";
import { performEnterNoMail } from "./performEnterNoMail.js";
import { performEnterWithMail } from "./performEnterWithMail.js";
import { MailDialogCancelledError } from "../helpers/mailDialog.js";
import { NATIVE_STATUS_ENTER } from "../update/nativeDelegateInWebview.js";

export async function performEnterAction(item, ctx = {}) {
  if (!item?.enterOnclick) {
    throw new Error("入室 onclick がありません");
  }

  if (isEnterMailEnabled(item)) {
    return performEnterWithMail(item, ctx);
  }

  return performEnterNoMail(item, ctx);
}

export { MailDialogCancelledError, NATIVE_STATUS_ENTER };
