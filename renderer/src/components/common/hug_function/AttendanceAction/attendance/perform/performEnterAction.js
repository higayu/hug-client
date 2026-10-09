/**
 * 入室処理の振り分け。
 *
 * メール通知設定で処理を分離する。
 * - メールなし: Renderer直書きDOMクリック経路
 * - メールあり: attendance_enter_with_mail のRenderer直書きDOMクリック経路
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
