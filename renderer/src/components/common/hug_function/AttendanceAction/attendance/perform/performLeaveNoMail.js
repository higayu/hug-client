import { executeAttendanceLeaveV2 } from "@/components/WebAutomationV2/runtime/attendanceFlows.js";

export const LEAVE_NO_MAIL_FLOW_KEY = "attendance_leave_no_mail";

function buildInput(item, ctx = {}) {
  return {
    facilityId: ctx.facilityId || item?.facilityId || item?.f_id || "1",
    dateStr:
      ctx.dateStr ||
      item?.date ||
      item?.detailPageDate ||
      new Date().toISOString().slice(0, 10),
    childId: item?.c_id ?? item?.childId ?? item?.children_id,
    recordId: item?.r_id ?? item?.recordId ?? item?.record_id,
    sendMail: 0,
    mailFlg: 0,
  };
}

export async function performLeaveNoMail(item, ctx = {}) {
  const result = await executeAttendanceLeaveV2(buildInput(item, ctx), {
    updateAppState: ctx.updateAppState,
  });

  return {
    ...result,
    success: true,
    mode: "web-automation-v2",
    flowKey: result?.flow?.flow_key || LEAVE_NO_MAIL_FLOW_KEY,
    handledRefresh: true,
    handledToast: true,
    statusMessage: "退室処理が完了しました",
  };
}
