/**
 * 入室（renderer 側の通知確認結果をそのまま POST へ渡す）
 *
 * メール通知モーダルは HUG 本体 webview に依存させない。
 * renderer 側で選択済みの場合は、列 HTML だけから item を作り、
 * webview の取得・一覧 fetch より先に通知確認を完了できるようにする。
 */

import {
  buildRowItemFromColumns,
  resolveAttendanceRowItem,
} from "../helpers/attendanceRowItem.js";
import {
  performEnterAction,
  MailDialogCancelledError,
} from "../perform/performEnterAction.js";
import { runAttendanceUpdate } from "../update/runAttendanceUpdate.js";
import store from "@/store/store.js";
import { getHugWebviewForCache } from "@/hooks/useHugCache/getHugCache.js";
import {
  clickHugMailDialogChoice,
  cancelHugMailDialog,
} from "../update/nativeDelegateInWebview.js";

/**
 * @param {string} column5Html
 * @param {number|string} targetChildrenId
 * @param {{
 *   children_name?: string,
 *   column5?: string,
 *   column6?: string,
 *   column6Html?: string,
 *   facilityId?: string,
 *   dateStr?: string,
 *   dispatch?: Function,
 *   updateAppState?: Function,
 *   skipRefresh?: boolean,
 *   mailFlg?: number,
 *   mail_flg?: number,
 * }} [opts]
 */
export async function clickEnterButton(column5Html, targetChildrenId, opts = {}) {
  try {

    // HUG側の本物のメール通知モーダルが開いた後の操作。
    // RendererではReact MailNotificationModalだけを表示し、
    // 選択結果はWebView内 .send_mail_button の実DOM clickへ委譲する。
    if (opts.mailDialogAction === "select") {
      const webview = await getHugWebviewForCache();
      const choice = Number(opts.mailDialogChoice) === 1 ? 1 : 0;
      const result = await clickHugMailDialogChoice(webview, choice);

      console.log("[Attendance MailDialog] Renderer選択をHUGへ反映", {
        action: "入室",
        choice,
        result,
      });

      if (opts.dispatch && !opts.skipRefresh) {
        await runAttendanceUpdate({
          facilityId: opts.facilityId || store.getState().appState?.FACILITY_ID || "1",
          dateStr: opts.dateStr || store.getState().appState?.CURRENT_YMD,
          dispatch: opts.dispatch,
          updateAppState: opts.updateAppState,
        });
      }

      return { success: true, ...result, mailDialogCompleted: true };
    }

    if (opts.mailDialogAction === "cancel") {
      const webview = await getHugWebviewForCache();
      const result = await cancelHugMailDialog(webview);
      console.log("[Attendance MailDialog] RendererキャンセルをHUGへ反映", {
        action: "入室",
        result,
      });
      return { success: true, cancelled: true, ...result };
    }

    const state = store.getState().appState;
    const facilityId = opts.facilityId || state?.FACILITY_ID || "1";
    const dateStr =
      opts.dateStr || state?.CURRENT_YMD || new Date().toISOString().slice(0, 10);

    const resolved = await resolveAttendanceRowItem({
      facilityId,
      dateStr,
      children_id: targetChildrenId,
      children_name: opts.children_name,
      column5: opts.column5,
      column5Html,
      column6: opts.column6,
      column6Html: opts.column6Html,
    });

    if (!resolved.ok || !resolved.item) {
      throw new Error(resolved.error || "出席行の解決に失敗しました");
    }

    const item = resolved.item;
    const resolvedWebview = resolved.webview || null;

    if (!item) {
      throw new Error("入室対象データを作成できませんでした");
    }

    if (String(item.c_id) !== String(targetChildrenId)) {
      throw new Error(
        `児童ID不一致: item=${item.c_id}, target=${targetChildrenId}`
      );
    }

    const requestedMailFlg = Number(
      opts.mailFlg ?? opts.mail_flg ?? 0
    ) === 1 ? 1 : 0;

    const result = await performEnterAction(item, {
      facilityId,
      dateStr,
      webview: resolvedWebview,
      mailFlg: requestedMailFlg,
      mail_flg: requestedMailFlg,
    });

    const waitingForMailDialog = Boolean(result?.mailDialogDetected || result?.mailDialog?.detected);

    if (!waitingForMailDialog && result.mode !== "native" && opts.dispatch && !opts.skipRefresh) {
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
    console.error("❌ [ATTENDANCE] 入室処理 NG", err);
    window.showErrorToast?.(`❌ 入室処理失敗\n${err.message}`, 3000);
    return { success: false, error: err.message };
  }
}
