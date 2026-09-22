import { useEffect, useMemo, useState } from 'react'

export function useStaffSelection({
  staffs,
  authenticatedStaffId,
}) {
  const [selectedStaffId, setSelectedStaffId] = useState('')

  const editableStaffs = useMemo(() => {
    const source = Array.isArray(staffs) ? staffs : []

    return source.filter(
      (staff) =>
        String(staff?.id) !== String(authenticatedStaffId),
    )
  }, [staffs, authenticatedStaffId])

  useEffect(() => {
    if (
      editableStaffs.some(
        (staff) => String(staff.id) === String(selectedStaffId),
      )
    ) {
      return
    }

    setSelectedStaffId(
      editableStaffs[0]?.id == null
        ? ''
        : String(editableStaffs[0].id),
    )
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
