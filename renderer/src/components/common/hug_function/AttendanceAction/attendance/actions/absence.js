import {
  createAttendanceRuntime,
  executeFlowV2,
} from "@/components/WebAutomationV2";

/**
 * 欠席ボタン → HUG本体の欠席モーダル表示。
 * 実行設定は WebAutomation V2 の attendance_absence から取得する。
 */
export async function clickAbsenceButton(column5Html, targetChildrenId) {
  try {
    const runtime = createAttendanceRuntime();
    const result = await executeFlowV2(
      "attendance_absence",
      {
        column5Html: String(column5Html || ""),
        childId: String(targetChildrenId || ""),
      },
      { runtime },
    );

    window.showSuccessToast?.("✅ 欠席モーダルを開きました", 2000);
    return {
      success: true,
      absenceId: result?.context?.absenceResult?.absenceId || null,
      executionUuid: result?.executionUuid || null,
    };
  } catch (err) {
    console.error("❌ [ATTENDANCE V2] 欠席モーダル表示 NG:", err);
    window.showErrorToast?.(`❌ 欠席モーダル表示失敗\n${err?.message || err}`, 3000);
    return { success: false, error: err?.message || String(err) };
  }
}
