import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectCanManageTargetStaff } from '@/store/roleSelectors'

export function useStaffSelection({
  staffs,
  authenticatedStaffId,
}) {
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const state = useSelector(s => s)

  const editableStaffs = useMemo(() => {
    const source = Array.isArray(staffs) ? staffs : []

    return source.filter(
      (staff) =>
        String(staff?.id) !== String(authenticatedStaffId) &&
        selectCanManageTargetStaff(state, staff?.id),
    )
  }, [staffs, authenticatedStaffId, state])

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
