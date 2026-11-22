
// 職員の所属会社は staffs.company_id を唯一の基準にします。
// company_staff はロール割当専用、facility_staff は施設所属専用です。
// 画面上の判定だけでは不十分なため、Laravel API 側でも必ず認可してください。
import { selectAuthenticatedStaffId, selectLaravelAuth } from './slices/authSlice.js';
import {
  selectCompanies,
  selectCompanyRoles,
  selectFacilityStaff,
  selectFacilitys,
  selectRoles,
  selectStaffCompanyRoles,
  selectStaffs,
} from './slices/databaseSlice.js';

const sameId = (a, b) => a != null && b != null && String(a) === String(b);
const active = (row) => row?.is_active == null || Number(row.is_active) === 1;

const getCurrentStaff = (state) => {
  const staffId = selectAuthenticatedStaffId(state);
  if (!staffId) return null;
  return selectStaffs(state).find((row) => sameId(row.id, staffId)) ?? null;
};

const getHomeCompany = (state) => {
  const companyId = getCurrentStaff(state)?.company_id;
  if (companyId == null) return null;
  return selectCompanies(state).find(
    (company) => sameId(company.id, companyId) && active(company)
  ) ?? null;
};

// このフラグは表示用です。所属会社・所属施設へのアクセス制限を解除しません。
export const selectIsGlobalAdmin = (state) =>
  selectLaravelAuth(state)?.user?.role_code === 'admin';

// 取得対象会社は権限を持つ会社の一覧ではなく、職員の所属会社1社だけです。
export const selectCurrentStaffCompanies = (state) => {
  const company = getHomeCompany(state);
  return company ? [company] : [];
};

// ロールは所属会社についてのみ有効です。
export const selectCurrentCompanyRole = (state, companyId) => {
  const staffId = selectAuthenticatedStaffId(state);
  const company = getHomeCompany(state);
  if (!staffId || !company || !sameId(company.id, companyId)) return null;

  const assignment = selectStaffCompanyRoles(state).find(
    (row) => sameId(row.staff_id, staffId) && sameId(row.company_id, companyId)
  );
  if (!assignment) return null;

  const enabled = selectCompanyRoles(state).some(
    (row) => sameId(row.company_id, companyId) && row.role_code === assignment.role_code
  );
  const role = selectRoles(state).find((row) => row.code === assignment.role_code);
  return enabled && role?.scope === 'company' && active(role)
    ? assignment.role_code
    : null;
};

export const selectCanManageCompanyStaff = (state, companyId) => {
  const homeCompany = getHomeCompany(state);
  if (!homeCompany || !sameId(homeCompany.id, companyId)) return false;

  const role = selectCurrentCompanyRole(state, companyId);
  return role === 'admin' || role === 'mentor' || role === 'franchise_mentor';
};

export const selectCanManageStaff = (state) => {
  const homeCompany = getHomeCompany(state);
  return homeCompany != null && selectCanManageCompanyStaff(state, homeCompany.id);
};

export const selectCanManageTargetStaff = (state, targetStaffId) => {
  if (targetStaffId == null) return false;
  const homeCompany = getHomeCompany(state);
  if (!homeCompany || !selectCanManageCompanyStaff(state, homeCompany.id)) return false;

  return selectStaffs(state).some(
    (staff) => sameId(staff.id, targetStaffId) && sameId(staff.company_id, homeCompany.id)
  );
};

export const selectAssignableCompanyRoles = (state, companyId) => {
  const homeCompany = getHomeCompany(state);
  if (!homeCompany || !sameId(homeCompany.id, companyId)) return [];

  const ownRole = selectCurrentCompanyRole(state, companyId);
  let allowed = [];

  if (sameId(companyId, 1)) {
    if (ownRole === 'admin') allowed = ['admin', 'mentor', 'staff'];
    else if (ownRole === 'mentor') allowed = ['mentor', 'staff'];
  } else {
    if (ownRole === 'franchise_mentor') allowed = ['franchise_staff'];
  }

  const permitted = new Set(
    selectCompanyRoles(state)
      .filter((row) => sameId(row.company_id, companyId))
      .map((row) => row.role_code)
  );

  return selectRoles(state).filter(
    (role) => role.scope === 'company' && active(role) &&
      allowed.includes(role.code) && permitted.has(role.code)
  );
};

export const selectCanAccessFacility = (state, facilityId) => {
  const staffId = selectAuthenticatedStaffId(state);
  const homeCompany = getHomeCompany(state);
  if (!staffId || !homeCompany || facilityId == null) return false;

  const facility = selectFacilitys(state).find((row) => sameId(row.id, facilityId));
  if (!facility || !sameId(facility.company_id, homeCompany.id)) return false;

  return selectFacilityStaff(state).some(
    (row) => sameId(row.staff_id, staffId) && sameId(row.facility_id, facilityId)
  );
};
