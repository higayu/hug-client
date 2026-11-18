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
import {
  getActiveWebview,
} from '@/utils/webview/webviewState.js';
import StaffUpdateButton from '@/components/common/Synchronization/StaffUpdateButton';

export default function StaffManagement({
  staffs,
  canManageStaff,
  facilityId,
  canSync,
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
    canManageStaff,
  })

  return (
    <section>
        <StaffUpdateButton
          facilityId={facilityId}
          disabled={!facilityId || !canSync}
          webview={getActiveWebview()}
          className=""
        />

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
