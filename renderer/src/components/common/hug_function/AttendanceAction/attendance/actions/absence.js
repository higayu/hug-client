// 欠席処理
// DB Flow / Step / Rule は使用しない。
// HUG出席詳細画面を直接操作して、欠席ダイアログを開く。

import { resolveAttendanceWebview } from "../_shared/webview.js";
import {
  extractAbsenceButtonId,
  assertAbsenceChildId,
} from "../_shared/extractors.js";

const ABSENCE_DIALOG_ID = "addtend_dialog";
const ABSENCE_DIALOG_WRAPPER_SELECTOR = ".ui-dialog";
const ABSENCE_DIALOG_TIMEOUT_MS = 2000;
const ABSENCE_DIALOG_POLL_INTERVAL_MS = 100;

/**
 * 欠席ボタンをクリックして、HUG本体の欠席ダイアログを開く。
 *
 * 処理:
 * 1. 非表示HUG WebViewで当日のattendance detailを読み込む
 * 2. column5Htmlから absence_xxx / absense_xxx のIDを取得
 * 3. ボタン内の児童IDと対象児童IDを照合
 * 4. 実DOM上の欠席ボタンをclick()
 * 5. #addtend_dialog が開くまで待機
 */
export async function clickAbsenceButton(column5Html, targetChildrenId) {
  try {
    const childId = String(targetChildrenId ?? "").trim();

    if (!childId) {
      throw new Error("欠席処理対象の児童IDがありません");
    }

    console.log("🔘 [ATTENDANCE] 欠席モーダル表示 START", {
      targetChildrenId: childId,
    });

    // 現在選択中の施設・日付でHUG attendance detailを強制再読込する。
    const webview = await resolveAttendanceWebview({
      loadDetailPage: true,
    });

    if (!webview) {
      throw new Error("HUG WebViewを取得できませんでした");
    }

    // 一覧取得時に保持したHTMLからHUG本体の欠席ボタンIDを取得する。
    const absenceId = extractAbsenceButtonId(column5Html);

    if (!absenceId) {
      throw new Error(
        "欠席ボタンID(absence_... / absense_...)を抽出できませんでした"
      );
    }

    // 別児童の欠席ボタンを誤って押さないためのチェック。
    assertAbsenceChildId(absenceId, childId);

    const result = await webview.executeJavaScript(`
      (async () => {
        try {
          const absenceId = ${JSON.stringify(absenceId)};
          const dialogId = ${JSON.stringify(ABSENCE_DIALOG_ID)};
          const wrapperSelector = ${JSON.stringify(
            ABSENCE_DIALOG_WRAPPER_SELECTOR
          )};
          const timeoutMs = ${ABSENCE_DIALOG_TIMEOUT_MS};
          const pollIntervalMs = ${ABSENCE_DIALOG_POLL_INTERVAL_MS};

          const button = document.getElementById(absenceId);

          if (!button) {
            return {
              success: false,
              error: "欠席ボタンが見つかりません: " + absenceId,
              absenceId,
              pageUrl: location.href,
            };
          }

          // HUG本体のイベント/JavaScriptへ処理を委譲する。
          button.click();

          const startedAt = Date.now();

          while (Date.now() - startedAt < timeoutMs) {
            const dialog = document.getElementById(dialogId);
            const wrapper = dialog
              ? dialog.closest(wrapperSelector)
              : null;

            if (dialog && wrapper) {
              const style = window.getComputedStyle(wrapper);
              const isOpen =
                style.display !== "none" &&
                style.visibility !== "hidden";

              if (isOpen) {
                return {
                  success: true,
                  absenceId,
                  dialogId,
                  waitedMs: Date.now() - startedAt,
                  pageUrl: location.href,
                };
              }
            }

            await new Promise((resolve) =>
              setTimeout(resolve, pollIntervalMs)
            );
          }

          return {
            success: false,
            error: dialogId + " が開きませんでした",
            absenceId,
            waitedMs: Date.now() - startedAt,
            pageUrl: location.href,
          };
        } catch (error) {
          return {
            success: false,
            error: error?.message || String(error),
            pageUrl: location.href,
          };
        }
      })();
    `);

    if (!result?.success) {
      throw new Error(
        result?.error || "欠席モーダル表示に失敗しました"
      );
    }

    console.log("✅ [ATTENDANCE] 欠席モーダル表示 OK", result);

    window.showSuccessToast?.(
      "✅ 欠席モーダルを開きました",
      2000
    );

    return {
      success: true,
      absenceId,
      dialogId: result.dialogId,
      waitedMs: result.waitedMs,
      pageUrl: result.pageUrl,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(error || "欠席モーダル表示に失敗しました");

    console.error("❌ [ATTENDANCE] 欠席モーダル表示 NG", error);

    window.showErrorToast?.(
      `❌ 欠席モーダル表示失敗\n${message}`,
      3000
    );

    return {
      success: false,
      error: message,
    };
  }
}
