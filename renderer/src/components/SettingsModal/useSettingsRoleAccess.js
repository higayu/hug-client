import { useCallback, useMemo } from 'react'
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
  const companies = databaseState?.companies ?? []
  const facilities = databaseState?.facilitys ?? []
  const companyRoles = databaseState?.company_staff ?? []
  const staffs = databaseState?.staffs ?? []
  // 認証時のrole_codeだけでなく、同期済みの最新割当も照合する。
  // ロール変更後に古い認証状態が残っていてもadmin画面を表示しない。
  const isAdmin = globalRole === 'admin' && companyRoles.some((membership) =>
    str(membership.staff_id) === str(staffId) &&
    str(membership.company_id) === '1' &&
    str(membership.role_code).trim().toLowerCase() === 'admin'
  )
  const ownCompanyId = staffs.find((staff) => str(staff.id) === str(staffId))?.company_id ?? auth?.user?.company_id

  // APIのデータスコープと同様、所属会社のみを対象にする。
  // company_staff は対象会社での操作ロールの判定に限って使用する。
  const authorizedCompanyIds = useMemo(() => {
    const ids = new Set()
    if (ownCompanyId == null) return ids
    if (isAdmin || companyRoles.some((membership) =>
      str(membership.staff_id) === str(staffId) &&
      str(membership.company_id) === str(ownCompanyId) &&
      elevated.has(str(membership.role_code))
    )) ids.add(str(ownCompanyId))
    return ids
  }, [isAdmin, ownCompanyId, companyRoles, staffId])

  const currentCompanyId = facilities.find((item) => str(item.id) === str(FACILITY_ID))?.company_id ?? null
  const canManageCurrentCompanyStaff = currentCompanyId != null && authorizedCompanyIds.has(str(currentCompanyId))
  // 管理設定タブ自体は、施設選択状態ではなく認証者の会社ロールで判定する。
  // global admin は company scope の検証対象に含めず、常に許可する。
  const canAccessAdminTab = isAdmin || authorizedCompanyIds.size > 0
  const canManageStaff = useCallback((staff) => {
    if (!staff || ownCompanyId == null) return false
    if (str(staff.company_id) !== str(ownCompanyId)) return false
    if (!canAccessAdminTab) return false
    if (str(staff.id) === str(staffId)) return true
    if (isAdmin) return true
    if (companyRoles.some((item) => str(item.staff_id) === str(staff.id) && str(item.company_id) === '1' && str(item.role_code) === 'admin')) return false
    if (companyRoles.some((item) => str(item.staff_id) === str(staff.id) && elevated.has(str(item.role_code)))) return false
    return true
  }, [canAccessAdminTab, companyRoles, isAdmin, ownCompanyId, staffId])
  return { auth, isAdmin, staffId, authorizedCompanyIds, canAccessAdminTab, canManageCurrentCompanyStaff, canManageStaff }
}
