// ChildAttendancePanel 専用の入退室処理

export { clickEnterButton } from "./actions/enter.js";
export { clickExitButton } from "./actions/exit.js";
export { clickAbsenceButton } from "./actions/absence.js";

export { performEnterAction } from "./perform/performEnterAction.js";
export {
  performEnterNoMail,
  ENTER_NO_MAIL_FLOW_KEY,
} from "./perform/performEnterNoMail.js";
export {
  performEnterWithMail,
  ENTER_WITH_MAIL_FLOW_KEY,
} from "./perform/performEnterWithMail.js";

export { performLeaveAction } from "./perform/performLeaveAction.js";
export {
  performLeaveNoMail,
  LEAVE_NO_MAIL_FLOW_KEY,
} from "./perform/performLeaveNoMail.js";
export {
  performLeaveWithMail,
  LEAVE_WITH_MAIL_FLOW_KEY,
} from "./perform/performLeaveWithMail.js";

export { runAttendanceUpdate } from "./update/runAttendanceUpdate.js";
export { resolveAttendanceRowItem } from "./helpers/attendanceRowItem.js";

export {
  extractEnterButtonOnclick,
  extractExitButtonOnclick,
  extractAbsenceButtonId,
  parseAbsenceId,
  assertAbsenceChildId,
} from "./_shared/extractors.js";
