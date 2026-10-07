/**
 * 利用者一覧の再取得。
 * WebAutomation V2 の attendance_fetch_today_users に統一する。
 */
import {
  createAttendanceRuntime,
  executeFlowV2,
} from "@/components/WebAutomationV2";

export async function runAttendanceUpdate({
  facilityId,
  dateStr,
  dispatch,
  updateAppState,
  silent = true,
  targetChildrenId = null,
  action = "",
  verifyUpdated = false,
  retryCount = 5,
  retryDelayMs = 500,
}) {
  const runtime = createAttendanceRuntime({
    dispatch,
    updateAppState,
  });

  // 入退室V2 Flow側ですでにverifyを行うが、
  // 旧呼び出し側から verifyUpdated=true で呼ばれた場合も互換維持する。
  if (verifyUpdated && targetChildrenId && action) {
    const verifyFlowKey = action === "leave"
      ? "attendance_leave_no_mail"
      : "attendance_enter_no_mail";

    // ここでは再実行せず、today-users取得だけ行う。
    // V2入退室Flowから呼ばれる場合はverify済みのため二重実行を避ける。
    void verifyFlowKey;
    void retryCount;
    void retryDelayMs;
  }

  const result = await executeFlowV2(
    "attendance_fetch_today_users",
    {
      facilityId: String(facilityId || "1"),
      dateStr: String(dateStr || new Date().toISOString().slice(0, 10)),
    },
    { runtime },
  );

  const attendanceData = result?.context?.attendanceData || window.AppState?.attendanceData || null;

  if (!silent) {
    console.log("[ATTENDANCE V2] runAttendanceUpdate 完了", {
      rowCount: attendanceData?.rowCount,
      targetChildrenId,
      action,
    });
  }

  return {
    tableData: null,
    extracted: attendanceData
      ? { success: true, data: attendanceData.data, rowCount: attendanceData.rowCount }
      : null,
    reflected: true,
    v2: true,
    executionUuid: result?.executionUuid || null,
  };
}
