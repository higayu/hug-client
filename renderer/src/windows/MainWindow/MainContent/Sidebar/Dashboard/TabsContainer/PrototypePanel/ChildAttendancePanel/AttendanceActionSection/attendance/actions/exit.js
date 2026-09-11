/**
 * 退室（拡張 performLeaveAction 経由）
 */

import { resolveAttendanceRowItem } from "../helpers/attendanceRowItem.js";
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
 * }} [opts]
 */
export async function clickExitButton(column6Html, targetChildrenId, opts = {}) {
  try {
    const state = store.getState().appState;
    const facilityId = opts.facilityId || state?.FACILITY_ID || "1";
    const dateStr =
      opts.dateStr || state?.CURRENT_YMD || new Date().toISOString().slice(0, 10);

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

    if (String(resolved.item.c_id) !== String(targetChildrenId)) {
      throw new Error(
        `児童ID不一致: item=${resolved.item.c_id}, target=${targetChildrenId}`
      );
    }

    const result = await performLeaveAction(resolved.item, {
      facilityId,
      dateStr,
      webview: resolved.webview,
    });

    if (result.mode !== "native" && opts.dispatch && !opts.skipRefresh) {
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
