// 会社別role: role_idの数値比較は使用しません。
// 権限の最終的な可否はLaravel APIでも必ず検証してください。
import { selectAuthenticatedStaffId, selectLaravelAuth } from './slices/authSlice.js';
import {
  selectCompanies, selectCompanyRoles, selectFacilityStaff, selectFacilitys,
  selectRoles, selectStaffCompanyRoles,
} from './slices/databaseSlice.js';

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const active = (row) => row?.is_active == null || Number(row.is_active) === 1;

export const selectIsGlobalAdmin = (state) =>
  selectLaravelAuth(state)?.user?.role_code === 'admin';

export const selectCurrentStaffCompanies = (state) => {
  const staffId = selectAuthenticatedStaffId(state);
  if (!staffId) return [];
  const companyIds = new Set(selectStaffCompanyRoles(state)
    .filter((row) => sameId(row.staff_id, staffId))
    .map((row) => String(row.company_id)));
  return selectCompanies(state).filter((company) =>
    companyIds.has(String(company.id)) && active(company)
  );
};

export const selectCurrentCompanyRole = (state, companyId) => {
  const staffId = selectAuthenticatedStaffId(state);
  if (!staffId || companyId == null) return null;
  const company = selectCurrentStaffCompanies(state).find((item) => sameId(item.id, companyId));
  if (!company) return null;
  const assignment = selectStaffCompanyRoles(state).find(
    (row) => sameId(row.staff_id, staffId) && sameId(row.company_id, companyId)
  );
  if (!assignment) return null;
  const enabled = selectCompanyRoles(state).some(
    (row) => sameId(row.company_id, companyId) && row.role_code === assignment.role_code
  );
  const role = selectRoles(state).find((row) => row.code === assignment.role_code);
  return enabled && role && role.scope === 'company' && active(role) ? assignment.role_code : null;
};

export const selectCanManageCompanyStaff = (state, companyId) => {
  if (selectIsGlobalAdmin(state)) return true;
  return ['mentor', 'franchise_mentor'].includes(selectCurrentCompanyRole(state, companyId));
};

export const selectCanManageStaff = (state) =>
  selectIsGlobalAdmin(state) ||
  selectCurrentStaffCompanies(state).some((company) =>
    selectCanManageCompanyStaff(state, company.id)
  );

export const selectCanManageTargetStaff = (state, targetStaffId) => {
  if (selectIsGlobalAdmin(state)) return true;
  if (targetStaffId == null) return false;

  return selectStaffCompanyRoles(state).some((membership) =>
    sameId(membership.staff_id, targetStaffId) &&
    selectCanManageCompanyStaff(state, membership.company_id)
  );
};

export const selectAssignableCompanyRoles = (state, companyId) => {
  const company = selectCompanies(state).find((row) => sameId(row.id, companyId) && active(row));
  if (!company) return [];
  const ownRole = selectCurrentCompanyRole(state, companyId);
  const allowed = selectIsGlobalAdmin(state)
    ? ['mentor', 'staff', 'franchise_mentor', 'franchise_staff']
    : ownRole === 'mentor' ? ['mentor', 'staff']
    : ownRole === 'franchise_mentor' ? ['franchise_staff'] : [];
  const permitted = new Set(selectCompanyRoles(state)
    .filter((row) => sameId(row.company_id, companyId)).map((row) => row.role_code));
  return selectRoles(state).filter((role) =>
    role.scope === 'company' && active(role) && allowed.includes(role.code) && permitted.has(role.code)
  );
};

export const selectCanAccessFacility = (state, facilityId) => {
  if (selectIsGlobalAdmin(state)) return true;
  const staffId = selectAuthenticatedStaffId(state);
  return Boolean(staffId) && selectFacilityStaff(state).some(
    (row) => sameId(row.staff_id, staffId) && sameId(row.facility_id, facilityId)
  );
};
