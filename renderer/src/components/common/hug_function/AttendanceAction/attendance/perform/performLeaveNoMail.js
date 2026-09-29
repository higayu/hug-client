import { executeAttendanceNativeFlow } from "../flow/attendanceNativeFlow.js";

export const LEAVE_NO_MAIL_FLOW_KEY = "attendance_leave_no_mail";

export async function performLeaveNoMail(item, ctx = {}) {
  return executeAttendanceNativeFlow(
    LEAVE_NO_MAIL_FLOW_KEY,
    "leave",
    item,
    ctx,
  );
}
