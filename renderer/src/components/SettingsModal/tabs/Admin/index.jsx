import { useState } from 'react'
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import { selectLaravelAuth } from '@/store/slices/authSlice'
import { selectCanManageStaff, selectIsGlobalAdmin } from '@/store/roleSelectors'

import AdminHeader from './components/AdminHeader'
import AdminSectionCards from './components/AdminSectionCards'
import {
  ADMIN_SECTION_IDS,
  ADMIN_SECTIONS,
} from './constants/adminSections'
import StaffManagement from './StaffManagement'
import WebAutomation from './WebAutomation'

export default function AdminTab() {
  const auth = useSelector(selectLaravelAuth)
  const isMentorOrAbove = useSelector(selectCanManageStaff)
  const isAdmin = useSelector(selectIsGlobalAdmin)
  const authenticatedStaffId = auth.user?.staff_id
  const {
    databaseState,
    DEBUG_FLG,
  } = useAppState()
  const [activeAdminSection, setActiveAdminSection] = useState(
    ADMIN_SECTION_IDS.STAFF_MANAGEMENT,
  )

  const visibleAdminSections = ADMIN_SECTIONS.filter((section) => {
    if (section.id === ADMIN_SECTION_IDS.WEB_AUTOMATION) {
      return isAdmin && DEBUG_FLG
    }

    return true
  })

  const visibleActiveSection = visibleAdminSections.some(
    (section) => section.id === activeAdminSection,
  )
    ? activeAdminSection
    : ADMIN_SECTION_IDS.STAFF_MANAGEMENT

  if (!isMentorOrAbove) {
    return null
  }

  return (
    <div>
      <AdminHeader />

      <AdminSectionCards
        sections={visibleAdminSections}
        activeSectionId={visibleActiveSection}
        onChangeSection={setActiveAdminSection}
      />

      {visibleActiveSection === ADMIN_SECTION_IDS.STAFF_MANAGEMENT && (
        <StaffManagement
          staffs={databaseState?.staffs}
          authenticatedStaffId={authenticatedStaffId}
        />
      )}

      {isAdmin &&
        DEBUG_FLG &&
        visibleActiveSection === ADMIN_SECTION_IDS.WEB_AUTOMATION && (
          <WebAutomation />
        )}
    </div>
  )
}
