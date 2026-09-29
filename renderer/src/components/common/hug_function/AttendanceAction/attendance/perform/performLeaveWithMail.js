import { executeAttendanceNativeFlow } from "../flow/attendanceNativeFlow.js";

export const LEAVE_WITH_MAIL_FLOW_KEY = "attendance_leave_with_mail";

export async function performLeaveWithMail(item, ctx = {}) {
  return executeAttendanceNativeFlow(
    LEAVE_WITH_MAIL_FLOW_KEY,
    "leave",
    item,
    ctx,
  );
}
