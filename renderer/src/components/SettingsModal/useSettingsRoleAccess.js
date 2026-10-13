import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { useAppState } from '@/AppStateContext'
import { selectLaravelAuth } from '@/store/slices/authSlice'

const elevated = new Set(['mentor', 'franchise_mentor'])
const str = (value) => String(value ?? '')

// The authenticated role is authoritative. Never infer privileges from legacy role_id.
export function useSettingsRoleAccess() {
  const auth = useSelector(selectLaravelAuth)
  const { databaseState, FACILITY_ID } = useAppState()
  const staffId = auth?.user?.staff_id ?? auth?.user?.id
  const globalRole = str(auth?.user?.role_code).trim().toLowerCase()
  const isAdmin = globalRole === 'admin'
  const companies = databaseState?.companies ?? []
  const facilities = databaseState?.facilitys ?? []
  const companyRoles = databaseState?.company_staff ?? []
  const facilityStaff = databaseState?.facility_staff ?? []

  const authorizedCompanyIds = useMemo(() => {
    const ids = new Set()
    if (isAdmin) {
      for (const company of companies) ids.add(str(company.id))
      for (const facility of facilities) if (facility.company_id != null) ids.add(str(facility.company_id))
    } else {
      for (const membership of companyRoles) {
        if (str(membership.staff_id) === str(staffId) && elevated.has(str(membership.role_code))) {
          ids.add(str(membership.company_id))
        }
      }
    }
    return ids
  }, [isAdmin, companies, facilities, companyRoles, staffId])

  const currentCompanyId = facilities.find((item) => str(item.id) === str(FACILITY_ID))?.company_id ?? null
  const canManageCurrentCompanyStaff = isAdmin || (currentCompanyId != null && authorizedCompanyIds.has(str(currentCompanyId)))
  const canManageStaff = (staff) => {
    if (!staff) return false
    if (str(staff.id) === str(staffId)) return false
    if (isAdmin) return true
    if (!canManageCurrentCompanyStaff) return false
    if (companyRoles.some((item) => str(item.staff_id) === str(staff.id) && str(item.company_id) === '1' && str(item.role_code) === 'admin')) return false
    const memberships = facilityStaff.filter((item) => str(item.staff_id) === str(staff.id))
    if (!memberships.length) return false
    const targetCompanyIds = new Set(memberships.map((item) => facilities.find((f) => str(f.id) === str(item.facility_id))?.company_id).filter((id) => id != null).map(str))
    if (!targetCompanyIds.size || [...targetCompanyIds].some((id) => !authorizedCompanyIds.has(id))) return false
    // Deny editing other elevated employees (including global admins).
    if (companyRoles.some((item) => str(item.staff_id) === str(staff.id) && elevated.has(str(item.role_code)))) return false
    return true
  }
  return { auth, isAdmin, staffId, authorizedCompanyIds, canManageCurrentCompanyStaff, canManageStaff }
}
