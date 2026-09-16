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
import store from "@/store/store.js";

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
 *   updateAppState?: Function,
 *   skipRefresh?: boolean,
 *   mailFlg?: number,
 *   mail_flg?: number,
 *   skipMailPrompt?: boolean,
 * }} [opts]
 */
export async function clickExitButton(column6Html, targetChildrenId, opts = {}) {
  try {
    const state = store.getState().appState;
    const facilityId = opts.facilityId || state?.FACILITY_ID || "1";
    const dateStr =
      opts.dateStr || state?.CURRENT_YMD || new Date().toISOString().slice(0, 10);

    const hasRendererMailDecision = opts.skipMailPrompt === true;

    let item;
    let resolvedWebview = null;

    if (hasRendererMailDecision) {
      // React renderer モーダルで通知有無を決定済み。
      // webview の HUG メールダイアログを経由しない。
      item = buildRowItemFromColumns({
        children_id: targetChildrenId,
        children_name: opts.children_name,
        column5: opts.enterTime || opts.column5,
        column5Html: opts.column5Html,
        column6: opts.column6,
        column6Html,
        dateStr,
      });
    } else {
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

      item = resolved.item;
      resolvedWebview = resolved.webview || null;
    }

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
      skipMailPrompt: hasRendererMailDecision,
    });

    if (opts.dispatch && !opts.skipRefresh) {
      await runAttendanceUpdate({
        facilityId,
        dateStr,
        dispatch: opts.dispatch,
        updateAppState: opts.updateAppState,
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
