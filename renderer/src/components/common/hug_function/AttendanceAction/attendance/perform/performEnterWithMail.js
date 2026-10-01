import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import { executeAttendanceNativeFlow } from "../flow/attendanceNativeFlow.js";

export const ENTER_WITH_MAIL_FLOW_KEY = "attendance_enter_with_mail";

/**
 * メール通知対象の入室。
 *
 * 実行内容は web_automation_flows / web_automation_flow_steps /
 * web_automation_rules から取得し、executeAttendanceNativeFlow に一本化する。
 * Renderer の MailNotificationModal で選択した mailFlg も Flow 実行へ渡す。
 */
export async function performEnterWithMail(item, ctx = {}) {
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

  return executeAttendanceNativeFlow(
    ENTER_WITH_MAIL_FLOW_KEY,
    "enter",
    item,
    ctx,
  );
}
