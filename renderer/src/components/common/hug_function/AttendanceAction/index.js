import './index.css'

// UI components
export { default as EnterButton } from './EnterButton'
export { default as LeaveButton } from './LeaveButton'
export { default as AttendancePostButton } from './AttendancePostButton'
export { default as MailNotificationModal } from './MailNotificationModal'

// Button/status helpers
export {
  canPostEnter,
  canPostLeave,
  hasEnterMail,
  hasLeaveMail,
  buildEnterButtonTitle,
  buildLeaveButtonTitle,
  isAfternoonEnterBlocked,
} from './attendance/helpers/attendanceButtonHelpers.js'

export {
  isAttendanceDataLoaded,
} from './attendance/helpers/attendanceStatus.js'

// Attendance row resolution
export {
  resolveAttendanceRowItem,
  buildRowItemFromColumns,
} from './attendance/helpers/attendanceRowItem.js'

// High-level actions
export {
  performEnterAction,
  MailDialogCancelledError as EnterMailDialogCancelledError,
} from './attendance/perform/performEnterAction.js'

export {
  performLeaveAction,
  MailDialogCancelledError as LeaveMailDialogCancelledError,
} from './attendance/perform/performLeaveAction.js'

// Existing action API used by ChildAttendancePanel
export {
  clickEnterButton,
  clickAbsenceButton,
  clickExitButton,
} from './attendance/index.js'
