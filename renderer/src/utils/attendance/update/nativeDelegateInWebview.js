/**
 * 拡張 native-delegate.js 相当（非表示 hugview + attendance.php 読込後）
 */

import {
  loadAttendanceDetailInWebview,
} from "../_shared/webview.js";
import { isEnterMailEnabled, isLeaveMailEnabled } from "../helpers/mailDialog.js";

export const NATIVE_STATUS_ENTER =
  "本番の入室処理を開始しました。ダイアログ操作後、利用者データを更新してください。";

export const NATIVE_STATUS_LEAVE =
  "本番の退室処理を開始しました。ダイアログ操作後、利用者データを更新してください。";

async function checkNativeInWebview(webview, r_id, kind) {
  const script = `
    (function() {
      const r_id = ${JSON.stringify(String(r_id))};
      const kind = ${JSON.stringify(kind)};
      const cellId = kind === "enter" ? "enter" + r_id : "leave" + r_id;
      const fn = kind === "enter" ? "sendEnterMail" : "sendLeaveMail";
      const cell = document.getElementById(cellId);
      const btn = cell?.querySelector?.("button[onclick*='" + fn + "']");
      const hasBtn = !!btn;
      let mailUiReady = true;
      if (kind === "enter") {
        const jq = window.jQuery || window.$;
        mailUiReady =
          typeof window.sendEnterMail === "function" &&
          typeof jq === "function" &&
          jq("#addtend_dialog_mail").length > 0;
      }
      return { hasBtn, mailUiReady };
    })();
  `;
  return webview.executeJavaScript(script);
}

export function shouldDelegateEnterToNative(item) {
  if (!item?.r_id) return false;
  return isEnterMailEnabled(item);
}

export function shouldDelegateLeaveToNative(item) {
  if (!item?.r_id) return false;
  return isLeaveMailEnabled(item);
}

/**
 * 本番ボタンクリック（出席詳細をバックグラウンド読込後）
 */
export async function tryNativeEnter(webview, item, { facilityId, dateStr }) {
  await loadAttendanceDetailInWebview(webview, facilityId, dateStr);
  const check = await checkNativeInWebview(webview, item.r_id, "enter");
  if (!check?.hasBtn) {
    throw new Error(
      `本番の入室ボタンが見つかりません（#enter${item.r_id}）。出席表を更新してください。`
    );
  }
  if (!check?.mailUiReady) {
    throw new Error(
      "本番の sendEnterMail またはメールダイアログがありません。HUG 出席表でログインを確認してください。"
    );
  }

  const rId = JSON.stringify(String(item.r_id));
  const clickResult = await webview.executeJavaScript(`
    (function() {
      const r_id = ${rId};
      const btn = document.querySelector("#enter" + r_id + " button[onclick*='sendEnterMail']");
      if (!btn) return { success: false, error: "ボタンなし" };
      btn.click();
      return { success: true };
    })();
  `);

  if (!clickResult?.success) {
    throw new Error(clickResult?.error || "本番入室ボタンのクリックに失敗");
  }

  return { mode: "native", statusMessage: NATIVE_STATUS_ENTER, success: true };
}

export async function tryNativeLeave(webview, item, { facilityId, dateStr }) {
  await loadAttendanceDetailInWebview(webview, facilityId, dateStr);
  const check = await checkNativeInWebview(webview, item.r_id, "leave");
  if (!check?.hasBtn) {
    throw new Error(
      `本番の退室ボタンが見つかりません（#leave${item.r_id}）。出席表を更新してください。`
    );
  }

  const rId = JSON.stringify(String(item.r_id));
  const clickResult = await webview.executeJavaScript(`
    (function() {
      const r_id = ${rId};
      const btn = document.querySelector("#leave" + r_id + " button[onclick*='sendLeaveMail']");
      if (!btn) return { success: false, error: "ボタンなし" };
      btn.click();
      return { success: true };
    })();
  `);

  if (!clickResult?.success) {
    throw new Error(clickResult?.error || "本番退室ボタンのクリックに失敗");
  }

  return { mode: "native", statusMessage: NATIVE_STATUS_LEAVE, success: true };
}
