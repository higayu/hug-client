import { useState } from 'react'

import Base from './Base'
import Login from './Login'
import StaffSectionTabs from './components/StaffSectionTabs'
import StaffSelector from './components/StaffSelector'
import {
  STAFF_SECTION_IDS,
  STAFF_SECTIONS,
} from './constants/staffSections'
import { useStaffSelection } from './hooks/useStaffSelection'

export default function StaffManagement({
  staffs,
  authenticatedStaffId,
}) {
  const [activeStaffSection, setActiveStaffSection] = useState(
    STAFF_SECTION_IDS.BASE,
  )

  const {
    editableStaffs,
    selectedStaff,
    selectedStaffId,
    setSelectedStaffId,
  } = useStaffSelection({
    staffs,
    authenticatedStaffId,
  })

  return (
    <section>
      <StaffSelector
        staffs={editableStaffs}
        selectedStaffId={selectedStaffId}
        onChangeStaffId={setSelectedStaffId}
      />

      {selectedStaffId && (
        <>
          <StaffSectionTabs
            sections={STAFF_SECTIONS}
            activeSectionId={activeStaffSection}
            onChangeSection={setActiveStaffSection}
          />

          {activeStaffSection === STAFF_SECTION_IDS.BASE ? (
            <Base staffId={selectedStaffId} />
          ) : (
            <Login staff={selectedStaff} />
          )}
        </>
      )}
    </section>
  )
}
