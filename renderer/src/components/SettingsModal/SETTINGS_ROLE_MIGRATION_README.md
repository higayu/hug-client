# SettingsModal role_code / company-role migration

- SettingsModal/index.jsx: remove numeric role_id permission checks; admin-only debug/WebAutomation, company-manager staff management.
- tabs/Admin: restrict company staff section by company_staff, admin-only V2 automation.
- tabs/Admin/StaffManagement: filter editable staff by accessible company and relative role. No company membership or role data => fail closed.
- tabs/StaffTab: remove editable numeric role field and role_id API payload; role editing belongs in Filament. Limit selectable facilities for managers and validate on save. Non-manager own profile facilities are read-only.
- tabs/Debug: only global admin.
- useSettingsRoleAccess.js: centralized display-only checks.

Data requirements: selectLaravelAuth must provide authenticated, user.staff_id and user.role_code. useAppState databaseState needs facilitys, facility_staff and company_staff. A user with no loaded company roles is not permitted to manage other staff. Global admin is separate.

WARNING: UI checks are not an authorization boundary. Laravel must validate target company, target staff, facility IDs and roles on each API write. No role-management API exists in this attachment, so role changes remain handled by Filament.
