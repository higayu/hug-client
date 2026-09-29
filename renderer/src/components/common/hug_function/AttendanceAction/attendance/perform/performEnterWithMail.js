import {
  getHalfTime,
  isAfternoonEnterHeldUntilHalfTime,
} from "../helpers/formHelpers.js";
import { executeAttendanceNativeFlow } from "../flow/attendanceNativeFlow.js";

export const ENTER_WITH_MAIL_FLOW_KEY = "attendance_enter_with_mail";

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
