import { executeAttendanceNativeFlow } from "../flow/attendanceNativeFlow.js";

export const LEAVE_WITH_MAIL_FLOW_KEY = "attendance_leave_with_mail";

/**
 * メール通知対象の退室。
 *
 * 実行内容はRenderer側へ直接定義し、executeAttendanceNativeFlow に一本化する。
 * Renderer の MailNotificationModal で選択した mailFlg をHUG側モーダルへ反映する。
 */
export async function performLeaveWithMail(item, ctx = {}) {
  return executeAttendanceNativeFlow(
    LEAVE_WITH_MAIL_FLOW_KEY,
    "leave",
    item,
    ctx,
  );
}
