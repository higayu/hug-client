// 欠席処理
// WebAutomation V2 の attendance_absence Flowへ委譲する。

import { executeFlowV2 } from "@/components/WebAutomationV2";
import {
  extractAbsenceButtonId,
} from "../_shared/extractors.js";

/**
 * 欠席ボタンをクリックして、HUG本体の欠席ダイアログを開く。
 *
 * 実際のWebView遷移・DOMクリック・ダイアログ待機は
 * DB側 attendance_absence Flow が担当する。
 */
export async function clickAbsenceButton(
  column5Html,
  targetChildrenId,
) {
  try {
    const childId =
      String(
        targetChildrenId ?? ""
      ).trim();

    if (!childId) {
      throw new Error(
        "欠席処理対象の児童IDがありません"
      );
    }

    const absenceId =
      extractAbsenceButtonId(
        column5Html
      );

    if (!absenceId) {
      throw new Error(
        "欠席ボタンID(absence_... / absense_...)を抽出できませんでした"
      );
    }

    console.log(
      "🔘 [ATTENDANCE V2] 欠席モーダル表示 START",
      {
        targetChildrenId:
          childId,
        absenceId,
      }
    );

    const result =
      await executeFlowV2(
        "attendance_absence",
        {
          absenceId,
          childId,
        },
      );

    if (!result?.success) {
      throw new Error(
        result?.error ||
        "欠席モーダル表示に失敗しました"
      );
    }

    console.log(
      "✅ [ATTENDANCE V2] 欠席モーダル表示 OK",
      result
    );

    window.showSuccessToast?.(
      "✅ 欠席モーダルを開きました",
      2000
    );

    return result;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : String(
            error ||
            "欠席モーダル表示に失敗しました"
          );

    console.error(
      "❌ [ATTENDANCE V2] 欠席モーダル表示 NG",
      error
    );

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
