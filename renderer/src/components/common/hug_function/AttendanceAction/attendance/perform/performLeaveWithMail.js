import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { tryNativeLeave } from "../update/nativeDelegateInWebview.js";

export const LEAVE_WITH_MAIL_FLOW_KEY = "attendance_leave_with_mail";

/**
 * メール通知対象の退室。
 *
 * 1. Renderer の MailNotificationModal で通知する/しないを選択
 * 2. HUG 本体の退室ボタンを button.click()
 * 3. HUG が #addtend_dialog_mail を表示
 * 4. MutationObserver で表示を検知
 * 5. Renderer で選択済みの data-send_mail=1/0 を自動 click
 *
 * HUG 本来の sendLeaveMail() -> モーダル -> 本処理という流れを維持する。
 */
export async function performLeaveWithMail(item, ctx = {}) {
  const webview = ctx.webview || (await getHugWebviewForCache());
  if (!webview) {
    throw new Error("退室処理用のHUG WebViewを取得できませんでした");
  }

  const mailFlg = Number(ctx.mailFlg ?? ctx.mail_flg) === 1 ? 1 : 0;

  const result = await tryNativeLeave(webview, item, {
    facilityId: ctx.facilityId || item?.f_id,
    dateStr: ctx.dateStr || item?.detailPageDate,
    mailFlg,
  });

  if (!result?.success) {
    throw new Error(result?.error || "メール通知付き退室処理に失敗しました");
  }

  return {
    ...result,
    success: true,
    mail_flg: mailFlg,
    statusMessage:
      mailFlg === 1
        ? "退室を登録し、保護者への通知を送信しました。"
        : "退室を登録しました。",
  };
}
