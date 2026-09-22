import { useState } from 'react'
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import { selectLaravelAuth } from '@/store/slices/authSlice'

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
  const isAdmin = Number(auth.user?.role_id) === 1
  const authenticatedStaffId = auth.user?.staff_id
  const {
    databaseState,
    DEBUG_FLG,
  } = useAppState()
  const [activeAdminSection, setActiveAdminSection] = useState(
    ADMIN_SECTION_IDS.STAFF_MANAGEMENT,
  )

  const visibleAdminSections = DEBUG_FLG
    ? ADMIN_SECTIONS
    : ADMIN_SECTIONS.filter(
        (section) => section.id !== ADMIN_SECTION_IDS.WEB_AUTOMATION,
      )

  const visibleActiveSection = DEBUG_FLG
    ? activeAdminSection
    : ADMIN_SECTION_IDS.STAFF_MANAGEMENT

  if (!isAdmin) {
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

      {DEBUG_FLG &&
        visibleActiveSection === ADMIN_SECTION_IDS.WEB_AUTOMATION && (
        <WebAutomation />
      )}
    </div>
  )
}
