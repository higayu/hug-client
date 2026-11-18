import { useSelector } from 'react-redux'

import {
  selectLaravelAuth,
  selectIsCompanyAutomationEnabled,
} from '@/store/slices/authSlice'
import { selectStaffCompanyRoles } from '@/store/slices/databaseSlice'

import { useSettingsRoleAccess } from '../../useSettingsRoleAccess'

function formatValue(value) {
  if (value === null) return 'null'
  if (value === undefined) return 'undefined'
  if (typeof value === 'string') return value || '(empty)'
  return JSON.stringify(value, null, 2)
}
export default function DebugTab() {
  const auth = useSelector(selectLaravelAuth)
  const companyStaff = useSelector(selectStaffCompanyRoles)
  const authenticatedStaffId = auth.user?.staff_id ?? auth.user?.id ?? null
  const ownCompanyStaff = authenticatedStaffId == null
    ? []
    : companyStaff.filter(
        (row) => String(row?.staff_id) === String(authenticatedStaffId),
      )

  const isCompanyAutomationEnabled = useSelector(
    selectIsCompanyAutomationEnabled
  )

  const { isAdmin } = useSettingsRoleAccess()

  if (!isAdmin) {
    return null
  }

  const fields = [
    ['staff_id', authenticatedStaffId],
    ['company_id', auth.user?.company_id ?? null],
    ['is_automation_enabled', auth.user?.is_automation_enabled],
    ['isCompanyAutomationEnabled', isCompanyAutomationEnabled],
    ['authenticated', auth.authenticated],
    ['hasAccessToken', auth.hasAccessToken],
    ['status', auth.status],
    ['error', auth.error],
  ]

  return (
    <div className="min-w-0">
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
        認証状態
      </h3>

      <dl className="divide-y divide-gray-200 border-y border-gray-200">
        {fields.map(([name, value]) => (
          <div
            key={name}
            className="
              grid
              grid-cols-1
              sm:grid-cols-[minmax(0,260px)_minmax(0,1fr)]
              items-start
              gap-2
              sm:gap-4
              px-2
              py-3
            "
          >
            <dt className="min-w-0 break-all font-mono text-sm font-semibold text-gray-600">
              {name}
            </dt>

            <dd className="min-w-0 whitespace-pre-wrap break-all font-mono text-sm text-gray-900">
              {formatValue(value)}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-5 min-w-0">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">
          user
        </h4>

        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all border border-gray-300 bg-gray-50 p-3 text-xs text-gray-900">
          {formatValue(auth.user)}
        </pre>
      </div>

      <div className="mt-5 min-w-0">
        <h4 className="mb-2 text-sm font-semibold text-gray-700">
          company_staff（ログイン中の職員）
        </h4>

        <p className="mb-2 text-xs text-gray-500">
          staff_id: {formatValue(authenticatedStaffId)} / {ownCompanyStaff.length}件
        </p>

        <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-all border border-gray-300 bg-gray-50 p-3 text-xs text-gray-900">
          {formatValue(ownCompanyStaff)}
        </pre>
      </div>
    </div>
  )
}
