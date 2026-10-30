import { useSelector } from 'react-redux';
import { useAppState } from '@/AppStateContext';
import { selectAuthenticatedStaffId, selectLaravelAuth } from '@/store/slices/authSlice';

const eq = (a, b) => a != null && b != null && String(a) === String(b);
export function useSettingsRoleAccess() {
  const auth = useSelector(selectLaravelAuth);
  const staffId = useSelector(selectAuthenticatedStaffId);
  const { databaseState, FACILITY_ID } = useAppState();
  const staffs = databaseState?.staffs ?? [];
  const companies = databaseState?.companies ?? [];
  const companyStaff = databaseState?.company_staff ?? [];
  const companyRoles = databaseState?.company_roles ?? [];
  const currentStaff = staffs.find((row) => eq(row.id, staffId));
  const homeCompany = companies.find((row) => eq(row.id, currentStaff?.company_id) && (row.is_active == null || Number(row.is_active) === 1));
  const companyId = homeCompany?.id ?? null;
  const ownAssignment = companyStaff.find((row) => eq(row.staff_id, staffId) && eq(row.company_id, companyId));
  const permitted = companyRoles.some((row) => eq(row.company_id, companyId) && row.role_code === ownAssignment?.role_code);
  const ownRole = permitted ? ownAssignment?.role_code : null;
  const isAdmin = auth?.user?.role_code === 'admin';
  const authorizedCompanyIds = new Set(companyId == null ? [] : [String(companyId)]);
  const currentFacility = (databaseState?.facilitys ?? []).find((row) => eq(row.id, FACILITY_ID));
  const canManageCurrentCompanyStaff = Boolean(companyId != null && eq(currentFacility?.company_id, companyId) && ['admin', 'mentor', 'franchise_mentor'].includes(ownRole));
  const canManageStaff = (staff) => Boolean(staff && !eq(staff.id, staffId) && companyId != null && eq(staff.company_id, companyId) && ['admin', 'mentor', 'franchise_mentor'].includes(ownRole));
  return { auth, isAdmin, staffId, authorizedCompanyIds, canManageCurrentCompanyStaff, canManageStaff };
}
