// 所属会社: staffs.company_id / 会社別ロール: company_staff / 施設所属: facility_staff
// 最終的な認可は Laravel API 側でも検証してください。
import { selectAuthenticatedStaffId, selectLaravelAuth } from './slices/authSlice.js';
import { selectCompanies, selectCompanyRoles, selectFacilityStaff, selectFacilitys, selectRoles, selectStaffCompanyRoles, selectStaffs } from './slices/databaseSlice.js';

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const active = (row) => row?.is_active == null || Number(row.is_active) === 1;
const ownCompany = (state) => {
  const staffId = selectAuthenticatedStaffId(state);
  const staff = selectStaffs(state).find((row) => sameId(row.id, staffId));
  return selectCompanies(state).find((row) => sameId(row.id, staff?.company_id) && active(row)) ?? null;
};

export const selectIsGlobalAdmin = (state) => selectLaravelAuth(state)?.user?.role_code === 'admin';
export const selectCurrentStaffCompanies = (state) => {
  const company = ownCompany(state);
  return company ? [company] : [];
};
export const selectCurrentCompanyRole = (state, companyId) => {
  const company = ownCompany(state);
  const staffId = selectAuthenticatedStaffId(state);
  if (!staffId || !company || !sameId(company.id, companyId)) return null;
  const assignment = selectStaffCompanyRoles(state).find((row) => sameId(row.staff_id, staffId) && sameId(row.company_id, companyId));
  if (!assignment) return null;
  const permitted = selectCompanyRoles(state).some((row) => sameId(row.company_id, companyId) && row.role_code === assignment.role_code);
  const role = selectRoles(state).find((row) => row.code === assignment.role_code);
  return permitted && role?.scope === 'company' && active(role) ? assignment.role_code : null;
};
export const selectCanManageCompanyStaff = (state, companyId) => {
  const company = ownCompany(state);
  return Boolean(company && sameId(company.id, companyId) && ['admin', 'mentor', 'franchise_mentor'].includes(selectCurrentCompanyRole(state, companyId)));
};
export const selectCanManageStaff = (state) => {
  const company = ownCompany(state);
  return Boolean(company && selectCanManageCompanyStaff(state, company.id));
};
export const selectCanManageTargetStaff = (state, targetStaffId) => {
  const company = ownCompany(state);
  const target = selectStaffs(state).find((row) => sameId(row.id, targetStaffId));
  return Boolean(company && target && sameId(target.company_id, company.id) && selectCanManageCompanyStaff(state, company.id));
};
export const selectAssignableCompanyRoles = (state, companyId) => {
  const company = ownCompany(state);
  if (!company || !sameId(company.id, companyId)) return [];
  const role = selectCurrentCompanyRole(state, companyId);
  const allowed = sameId(companyId, 1)
    ? (role === 'admin' ? ['admin', 'mentor', 'staff'] : role === 'mentor' ? ['mentor', 'staff'] : [])
    : (role === 'franchise_mentor' ? ['franchise_staff'] : []);
  const permitted = new Set(selectCompanyRoles(state).filter((row) => sameId(row.company_id, companyId)).map((row) => row.role_code));
  return selectRoles(state).filter((row) => row.scope === 'company' && active(row) && allowed.includes(row.code) && permitted.has(row.code));
};
export const selectCanAccessFacility = (state, facilityId) => {
  const company = ownCompany(state);
  const staffId = selectAuthenticatedStaffId(state);
  const facility = selectFacilitys(state).find((row) => sameId(row.id, facilityId));
  return Boolean(company && staffId && facility && sameId(facility.company_id, company.id) && selectFacilityStaff(state).some((row) => sameId(row.staff_id, staffId) && sameId(row.facility_id, facilityId)));
};
