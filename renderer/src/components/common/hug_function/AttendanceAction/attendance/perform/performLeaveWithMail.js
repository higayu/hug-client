import { executeAttendanceNativeFlow } from "../flow/attendanceNativeFlow.js";

export const LEAVE_WITH_MAIL_FLOW_KEY = "attendance_leave_with_mail";

/**
 * メール通知対象の退室。
 *
 * 実行内容は web_automation_flows / web_automation_flow_steps /
 * web_automation_rules から取得し、executeAttendanceNativeFlow に一本化する。
 * Renderer の MailNotificationModal で選択した mailFlg も Flow 実行へ渡す。
 */
export async function performLeaveWithMail(item, ctx = {}) {
  return executeAttendanceNativeFlow(
    LEAVE_WITH_MAIL_FLOW_KEY,
    "leave",
    item,
    ctx,
  );
}
