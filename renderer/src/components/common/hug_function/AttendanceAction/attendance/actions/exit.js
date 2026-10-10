/**
 * 退室（renderer 側の通知確認結果をそのまま POST へ渡す）
 */

import {
  buildRowItemFromColumns,
  resolveAttendanceRowItem,
} from "../helpers/attendanceRowItem.js";
import {
  performLeaveAction,
  MailDialogCancelledError,
} from "../perform/performLeaveAction.js";
import { runAttendanceUpdate } from "../update/runAttendanceUpdate.js";
import { fetchAttendanceRowByChildId } from "../fetch/fetchAttendanceListInWebview.js";
import store from "@/store/store.js";
import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  clickHugMailDialogChoice,
  cancelHugMailDialog,
} from "../update/nativeDelegateInWebview.js";

/**
 * @param {string} column6Html
 * @param {number|string} targetChildrenId
 * @param {{
 *   enterTime?: string,
 *   children_name?: string,
 *   column5?: string,
 *   column5Html?: string,
 *   column6?: string,
 *   facilityId?: string,
 *   dateStr?: string,
 *   dispatch?: Function,
 *   skipRefresh?: boolean,
 *   mailFlg?: number,
 *   mail_flg?: number,
 * }} [opts]
 */
export async function clickExitButton(column6Html, targetChildrenId, opts = {}) {
  try {

    // HUG側の本物のメール通知モーダルが開いた後の操作。
    // RendererではReact MailNotificationModalだけを表示し、
    // 選択結果はWebView内 .send_mail_button の実DOM clickへ委譲する。
    if (opts.mailDialogAction === "select") {
      const webview = await getHugWebviewForCache();
      const choice = Number(opts.mailDialogChoice) === 1 ? 1 : 0;
      const result = await clickHugMailDialogChoice(webview, choice);

      console.log("[Attendance MailDialog] Renderer選択をHUGへ反映", {
        action: "退室",
        choice,
        result,
      });

      if (!opts.skipRefresh) {
        await runAttendanceUpdate({
          facilityId: opts.facilityId || store.getState().appState?.FACILITY_ID || "1",
          dateStr: opts.dateStr || store.getState().appState?.CURRENT_YMD,
          dispatch: opts.dispatch,
          // HUGメール通知モーダルのclick()はAjax開始直後に戻るため、
          // 対象児童の更新済みHTMLが取得できるまで確認付きで再取得する。
          targetChildrenId,
          action: "leave",
          verifyUpdated: true,
          retryCount: 6,
          retryDelayMs: 500,
        });
      }

      return { success: true, ...result, mailDialogCompleted: true };
    }

    if (opts.mailDialogAction === "cancel") {
      const webview = await getHugWebviewForCache();
      const result = await cancelHugMailDialog(webview);
      console.log("[Attendance MailDialog] RendererキャンセルをHUGへ反映", {
        action: "退室",
        result,
      });
      return { success: true, cancelled: true, ...result };
    }

    const state = store.getState().appState;
    const facilityId = opts.facilityId || state?.FACILITY_ID || "1";
    const dateStr =
      opts.dateStr || state?.CURRENT_YMD || new Date().toISOString().slice(0, 10);

    console.log("[clickExitButton] 退室処理開始", {
      targetChildrenId,
      facilityId,
      dateStr,
      column6Html,
      opts,
    });

    const resolved = await resolveAttendanceRowItem({
      facilityId,
      dateStr,
      children_id: targetChildrenId,
      children_name: opts.children_name,
      column5: opts.enterTime || opts.column5,
      column5Html: opts.column5Html,
      column6: opts.column6,
      column6Html,
    });

    if (!resolved.ok || !resolved.item) {
      throw new Error(resolved.error || "出席行の解決に失敗しました");
    }

    let item = resolved.item;
    let resolvedWebview = resolved.webview || null;

    // Renderer側のメール選択後は column6Html が渡らない場合がある。
    // r_id が空なら HUG の最新 attendance.php を取得し、
    // 実際の sendLeaveMail(...) onclick の第1引数から復元する。
    if (item && !item.r_id) {
      console.warn(
        "[clickExitButton] r_id 未取得。HUG本体のonclickから再取得します",
        { targetChildrenId, facilityId, dateStr, item }
      );

      const fetched = await fetchAttendanceRowByChildId({
        facilityId,
        dateStr,
        childId: targetChildrenId,
      });

      console.log("[clickExitButton] onclick再取得結果", {
        ok: fetched?.ok,
        error: fetched?.error,
        fetchedItem: fetched?.item,
        leaveOnclick: fetched?.item?.leaveOnclick,
        extractedRId: fetched?.item?.r_id,
      });

      if (fetched?.ok && fetched?.item) {
        item = {
          ...item,
          ...fetched.item,
          c_id: String(fetched.item.c_id || item.c_id || targetChildrenId),
          r_id: String(fetched.item.r_id || item.r_id || ""),
          leaveOnclick: fetched.item.leaveOnclick || item.leaveOnclick || "",
        };
        resolvedWebview = fetched.webview || resolvedWebview;
      }
    }

    console.log("[clickExitButton] 解決した退室対象 item", {
      item,
      resolvedWebview: Boolean(resolvedWebview),
      r_id: item?.r_id,
      c_id: item?.c_id,
      leaveOnclick: item?.leaveOnclick,
    });

    if (!item) {
      throw new Error("退室対象データを作成できませんでした");
    }

    if (String(item.c_id) !== String(targetChildrenId)) {
      throw new Error(
        `児童ID不一致: item=${item.c_id}, target=${targetChildrenId}`
      );
    }

    const requestedMailFlg = Number(
      opts.mailFlg ?? opts.mail_flg ?? 0
    ) === 1 ? 1 : 0;

    const result = await performLeaveAction(item, {
      facilityId,
      dateStr,
      webview: resolvedWebview,
      mailFlg: requestedMailFlg,
      mail_flg: requestedMailFlg,
    });

    const waitingForMailDialog = Boolean(
      (result?.mailDialogDetected || result?.mailDialog?.detected) &&
      !result?.mailDialogAutoSelected
    );

    if (!waitingForMailDialog && !opts.skipRefresh) {
      await runAttendanceUpdate({
        facilityId,
        dateStr,
        dispatch: opts.dispatch,
        targetChildrenId,
        action: "leave",
        verifyUpdated: true,
        retryCount: 6,
        retryDelayMs: 500,
      });
    }

    window.showSuccessToast?.(result.statusMessage, 3000);
    return { success: true, ...result };
  } catch (err) {
    if (err instanceof MailDialogCancelledError) {
      return { success: false, cancelled: true, error: err.message };
    }
    console.error("❌ [ATTENDANCE] 退室処理 NG", err);
    window.showErrorToast?.(`❌ 退室処理失敗\n${err.message}`, 3000);
    return { success: false, error: err.message };
  }
}
