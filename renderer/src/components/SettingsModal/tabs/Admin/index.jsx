import { useState } from 'react'

import { useAppState } from '@/AppStateContext'
import { useSettingsRoleAccess } from '../../useSettingsRoleAccess'

import AdminHeader from './components/AdminHeader'
import AdminSectionCards from './components/AdminSectionCards'
import {
  ADMIN_SECTION_IDS,
  ADMIN_SECTIONS,
} from './constants/adminSections'
import StaffManagement from './StaffManagement'
import ChildManager from './ChildManager'
import WebAutomation from './WebAutomation'

export default function AdminTab() {
  const { canAccessAdminTab, canManageStaff, canManageCurrentCompanyStaff, isAdmin } = useSettingsRoleAccess()
  const {
    databaseState,
    FACILITY_ID,
  } = useAppState()
  const [activeAdminSection, setActiveAdminSection] = useState(
    ADMIN_SECTION_IDS.STAFF_MANAGEMENT,
  )

  const visibleAdminSections = ADMIN_SECTIONS.filter((section) => {
    if (section.id === ADMIN_SECTION_IDS.WEB_AUTOMATION) {
      return isAdmin
    }

    return true
  })

  const visibleActiveSection = visibleAdminSections.some(
    (section) => section.id === activeAdminSection,
  )
    ? activeAdminSection
    : ADMIN_SECTION_IDS.STAFF_MANAGEMENT

  if (!canAccessAdminTab) {
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
          canManageStaff={canManageStaff}
          facilityId={FACILITY_ID}
          canSync={canManageCurrentCompanyStaff}
        />
      )}

      {visibleActiveSection === ADMIN_SECTION_IDS.CHILD_MANAGEMENT && (
        <ChildManager
          key={FACILITY_ID}
          databaseState={databaseState}
          facilityId={FACILITY_ID}
          canSync={canManageCurrentCompanyStaff}
        />
      )}

      {isAdmin &&
        visibleActiveSection === ADMIN_SECTION_IDS.WEB_AUTOMATION && (
          <WebAutomation />
        )}
    </div>
  )
}
