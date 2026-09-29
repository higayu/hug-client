/**
 * 入退室ボタンのメール通知設定判定。
 *
 * メール通知確認UIは React の MailNotificationModal.jsx に一本化する。
 * ここではRenderer DOMへ独自モーダルを生成しない。
 */

import { isMailFromEnterOnclick } from "../post/enterPost.js";
import { isMailFromLeaveOnclick } from "../post/leavePost.js";

export class MailDialogCancelledError extends Error {
  constructor() {
    super("メール送信の選択がキャンセルされました");
    this.name = "MailDialogCancelledError";
  }
}

/** 入室ボタンがメール通知確認対象か */
export function isEnterMailEnabled(item) {
  if (item?.isEnterMailEnabled === true) return true;
  if (Number(item?.enterIsMailResolved) === 1) return true;
  if (item?.enterOnclick && isMailFromEnterOnclick(item.enterOnclick)) return true;
  if (item?.enterIsMail != null && item.enterIsMail !== "") {
    return Number(item.enterIsMail) === 1;
  }
  return false;
}

/** 退室ボタンがメール通知確認対象か */
export function isLeaveMailEnabled(item) {
  if (item?.leaveOnclick && isMailFromLeaveOnclick(item.leaveOnclick)) return true;
  if (item?.leaveIsMail != null && item.leaveIsMail !== "") {
    return Number(item.leaveIsMail) === 1;
  }
  return false;
}
