import AttendancePostButton from "../AttendancePostButton"
import { handleLeaveClick } from "./function/handleLeaveClick"

export default function LeaveButton({
  hasMail = false,
  disabled = false,
  loading = false,
  title = "",
  onLeave,
}) {
  return (
    <AttendancePostButton
      action="leave"
      hasMail={hasMail}
      disabled={disabled}
      loading={loading}
      title={title}
      onClick={() => handleLeaveClick({ onLeave })}
    />
  )
}
