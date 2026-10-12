// Laravel認証と会社別roleの権限判定。旧role_idへのフォールバックは禁止。
export const selectAuthRoleCode = (state) => String(state.auth?.user?.role_code ?? '').toLowerCase()
export const selectIsGlobalAdmin = (state) => Boolean(state.auth?.authenticated && selectAuthRoleCode(state) === 'admin')
const rows = (value) => Array.isArray(value) ? value : []
const equals = (a, b) => a != null && b != null && String(a) === String(b)
export const selectManagedCompanyIds = (state) => {
  if (!state.auth?.authenticated) return []
  const staffId = state.auth?.user?.staff_id
  if (staffId == null) return []
  return [...new Set(rows(state.database?.staff_company_roles)
    .filter((r) => equals(r.staff_id, staffId) && ['mentor', 'franchise_admin'].includes(r.role_code))
    .map((r) => String(r.company_id)))]
}
export const selectCanManageStaff = (state) => selectIsGlobalAdmin(state) || selectManagedCompanyIds(state).length > 0
export const selectCanManageTargetStaff = (state, targetStaffId) => {
  if (!state.auth?.authenticated || targetStaffId == null) return false
  if (equals(targetStaffId, state.auth?.user?.staff_id)) return false
  if (selectIsGlobalAdmin(state)) return true
  const target = rows(state.database?.staffs).find(s => equals(s.id, targetStaffId))
  if (!target || ['admin', 'mentor', 'franchise_admin'].includes(String(target.role_code ?? ''))) return false
  const targetCompanyRoles = rows(state.database?.staff_company_roles).filter(r => equals(r.staff_id, targetStaffId))
  if (targetCompanyRoles.some(r => ['mentor', 'franchise_admin'].includes(r.role_code))) return false
  const managed = selectManagedCompanyIds(state)
  if (!managed.length) return false
  const facilityIds = rows(state.database?.facility_staff)
    .filter(r => equals(r.staff_id, targetStaffId)).map(r => r.facility_id)
  const assigned = rows(state.database?.facilitys)
    .filter(f => facilityIds.some(id => equals(id, f.id)))
  // 未所属や複数会社所属の職員は、安全側で管理不可とする。
  return assigned.length > 0 && assigned.every(f => f.company_id != null && managed.includes(String(f.company_id)))
}
export const selectCanManageFacility = (state, facilityId) => {
  if (!state.auth?.authenticated) return false
  if (selectIsGlobalAdmin(state)) return true
  const managed = selectManagedCompanyIds(state)
  return rows(state.database?.facilitys).some(f => equals(f.id, facilityId) && managed.includes(String(f.company_id)))
}
