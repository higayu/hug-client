import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import { executeAttendanceEnterV2 } from "@/components/WebAutomationV2/runtime/attendanceFlows.js";

export const ENTER_NO_MAIL_FLOW_KEY = "attendance_enter_no_mail";

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

export async function performEnterNoMail(item, ctx = {}) {
  if (
    isAfternoonEnterHeldUntilHalfTime(
      item?.hugAlertPref || { amPmFlag: 0 },
      getHalfTime(),
      new Date(),
    )
  ) {
    throw new Error(
      `午後枠のためハーフタイム（${getHalfTime()}）まで入室できません`,
    );
  }

  const result = await executeAttendanceEnterV2(buildInput(item, ctx), {
    updateAppState: ctx.updateAppState,
  });

  return {
    ...result,
    success: true,
    mode: "web-automation-v2",
    flowKey: result?.flow?.flow_key || ENTER_NO_MAIL_FLOW_KEY,
    handledRefresh: true,
    handledToast: true,
    statusMessage: "入室処理が完了しました",
  };
}
