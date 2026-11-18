import { useEffect, useMemo, useState } from 'react'

export function useStaffSelection({
  staffs,
  canManageStaff,
}) {
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const editableStaffs = useMemo(() => {
    const source = Array.isArray(staffs) ? staffs : []

    return source.filter((staff) => canManageStaff(staff))
  }, [staffs, canManageStaff])

  useEffect(() => {
    if (
      editableStaffs.some(
        (staff) => String(staff.id) === String(selectedStaffId),
      )
    ) {
      return
    }

    const nextStaffId = editableStaffs[0]?.id == null
      ? ''
      : String(editableStaffs[0].id)

    if (String(selectedStaffId) !== nextStaffId) {
      setSelectedStaffId(nextStaffId)
    }
  }, [editableStaffs, selectedStaffId])

  const selectedStaff = useMemo(
    () =>
      editableStaffs.find(
        (staff) => String(staff.id) === String(selectedStaffId),
      ) ?? null,
    [editableStaffs, selectedStaffId],
  )

  return {
    editableStaffs,
    selectedStaff,
    selectedStaffId,
    setSelectedStaffId,
  }
}
