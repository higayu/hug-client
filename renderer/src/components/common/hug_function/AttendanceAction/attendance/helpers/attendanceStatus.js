const TIME_RE = /^\d{2}:\d{2}$/

export const SELECT_CHILD_FILTER_MODES = {
  ALL: 0,
  EXCLUDE_ABSENT: 1,
  EXCLUDE_ABSENT_AND_EXITED: 2,
}

export function isTimeFormat(value) {
  return TIME_RE.test(value || '')
}

export function isAbsentFromColumn5(column5) {
  return typeof column5 === 'string' && column5.startsWith('欠席')
}

export function getAttendanceItemForChild(attendanceData, childId) {
  const list = attendanceData?.data
  if (!Array.isArray(list)) return null
  return list.find((item) => String(item.children_id) === String(childId)) || null
}

export function isAttendanceDataLoaded(attendanceData) {
  return Array.isArray(attendanceData?.data)
}

export function isChildAbsent(attendanceItem) {
  if (!attendanceItem) return false
  return isAbsentFromColumn5(attendanceItem.column5)
}

/** AttendanceActionSection の専門的支援ボタン表示条件と同じ（入室済みかつ退室済み） */
export function isChildExited(attendanceItem) {
  if (!attendanceItem) return false
  return (
    isTimeFormat(attendanceItem.column5) && isTimeFormat(attendanceItem.column6)
  )
}

export function shouldHideChildByFilter(attendanceItem, filterMode) {
  if (Number(filterMode) === SELECT_CHILD_FILTER_MODES.ALL) return false
  if (!attendanceItem) return false

  const isAbsent = isChildAbsent(attendanceItem)
  const hasExited = isTimeFormat(attendanceItem.column6)

  if (Number(filterMode) === SELECT_CHILD_FILTER_MODES.EXCLUDE_ABSENT) {
    return isAbsent
  }

  if (Number(filterMode) === SELECT_CHILD_FILTER_MODES.EXCLUDE_ABSENT_AND_EXITED) {
    return isAbsent || hasExited
  }

  return false
}
