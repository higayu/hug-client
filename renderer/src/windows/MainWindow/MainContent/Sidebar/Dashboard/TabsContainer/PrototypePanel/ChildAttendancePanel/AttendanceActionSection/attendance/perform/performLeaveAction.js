/**
 * 拡張 leave-post.js + form-events.js 退室分岐
 */

import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import { buildLeavePatchFromRow } from "../helpers/formHelpers.js";
import {
  isLeaveMailEnabled,
  resolveMailFlgForPost,
  MailDialogCancelledError,
} from "../helpers/mailDialog.js";
import { taishitsuFromOnclickInWebview } from "../post/postAttendanceInWebview.js";
import {
  tryNativeLeave,
  NATIVE_STATUS_LEAVE,
} from "../update/nativeDelegateInWebview.js";
import { loadAttendanceDetailInWebview } from "../_shared/webview.js";

/**
 * @param {object} item
 * @param {{ facilityId: string, dateStr: string, webview?: Electron.WebviewTag }} ctx
 */
export async function performLeaveAction(item, ctx) {
  const { facilityId, dateStr } = ctx || {};

  if (!item?.leaveOnclick) {
    throw new Error("退室 onclick がありません");
  }

  const webview = ctx?.webview || (await getHugWebviewForCache());

  if (isLeaveMailEnabled(item)) {
    await loadAttendanceDetailInWebview(webview, facilityId, dateStr);
    try {
      const nativeResult = await tryNativeLeave(webview, item, {
        facilityId,
        dateStr,
      });
      return { ...nativeResult, success: true };
    } catch (nativeErr) {
      console.warn(
        "[ATTENDANCE] 本番退室委譲失敗、拡張POSTへフォールバック:",
        nativeErr.message
      );
    }

    const mail_flg = await resolveMailFlgForPost(item, "leave");
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
      mode: "extension-mail",
      mail_flg,
      success: true,
      dataList: postResult.dataList,
      statusMessage: `退室を送信しました（r_id=${postResult.dataList.r_id} / mail_flg=${mail_flg}）`,
    };
  }

  const patch = buildLeavePatchFromRow(item, { mail_flg: 0 });
  const postResult = await taishitsuFromOnclickInWebview(
    webview,
    item.leaveOnclick,
    patch
  );

  if (!postResult?.success) {
    throw new Error(postResult?.error || "退室 POST に失敗しました");
  }

  return {
    mode: "extension",
    mail_flg: 0,
    success: true,
    dataList: postResult.dataList,
    statusMessage: `退室を送信しました（r_id=${postResult.dataList.r_id}）`,
  };
}

export { MailDialogCancelledError, NATIVE_STATUS_LEAVE };
