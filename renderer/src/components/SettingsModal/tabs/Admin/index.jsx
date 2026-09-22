import { useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import { selectLaravelAuth } from '@/store/slices/authSlice'

import AutomationRulesTab from './AutomationRulesTab'
import Base from './Base'
import Login from './Login'

const ADMIN_SECTIONS = [
  {
    id: 'staff',
    label: '職員管理',
    description: '職員の基本情報・ログイン情報を編集します。',
  },
  {
    id: 'automation-rules',
    label: 'Web自動化',
    description:
      'web_automation_rules / flows / flow_steps を確認・編集します。',
  },
]

const STAFF_SECTIONS = [
  ['base', '基本情報'],
  ['login', 'ログイン情報'],
]

export default function AdminTab() {
  const auth = useSelector(selectLaravelAuth)
  const isAdmin = Number(auth.user?.role_id) === 1
  const authenticatedStaffId = auth.user?.staff_id
  const { databaseState } = useAppState()
  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [activeAdminSection, setActiveAdminSection] = useState('staff')
  const [activeStaffSection, setActiveStaffSection] = useState('base')

  const editableStaffs = useMemo(() => {
    const staffs = Array.isArray(databaseState?.staffs)
      ? databaseState.staffs
      : []

    return staffs.filter(
      (staff) =>
        String(staff?.id) !== String(authenticatedStaffId),
    )
  }, [databaseState?.staffs, authenticatedStaffId])

  useEffect(() => {
    if (
      editableStaffs.some(
        (staff) => String(staff.id) === String(selectedStaffId),
      )
    ) {
      return
    }

    setSelectedStaffId(
      editableStaffs[0]?.id == null
        ? ''
        : String(editableStaffs[0].id),
    )
  }, [editableStaffs, selectedStaffId])

  const selectedStaff = editableStaffs.find(
    (staff) => String(staff.id) === String(selectedStaffId),
  ) ?? null

  if (!isAdmin) {
    return null
  }

  return (
    <div>
      <div className="mb-5 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
        <h3 className="text-lg font-semibold text-blue-900">
          管理者設定
        </h3>
        <p className="mt-1 text-sm text-blue-800">
          管理者だけが操作できる設定を、この画面内で切り替えて編集します。
        </p>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2">
        {ADMIN_SECTIONS.map((section) => {
          const isActive = activeAdminSection === section.id

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveAdminSection(section.id)}
              className={`rounded-lg border p-4 text-left transition-colors ${
                isActive
                  ? 'border-blue-500 bg-blue-50 shadow-sm'
                  : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <div
                className={`text-sm font-semibold ${
                  isActive ? 'text-blue-700' : 'text-gray-800'
                }`}
              >
                {section.label}
              </div>
              <div className="mt-1 text-xs leading-5 text-gray-600">
                {section.description}
              </div>
            </button>
          )
        })}
      </div>

      {activeAdminSection === 'staff' ? (
        <StaffManagementPanel
          editableStaffs={editableStaffs}
          selectedStaffId={selectedStaffId}
          setSelectedStaffId={setSelectedStaffId}
          activeStaffSection={activeStaffSection}
          setActiveStaffSection={setActiveStaffSection}
          selectedStaff={selectedStaff}
        />
      ) : (
        <AutomationRulesTab />
      )}
    </div>
  )
}

function StaffManagementPanel({
  editableStaffs,
  selectedStaffId,
  setSelectedStaffId,
  activeStaffSection,
  setActiveStaffSection,
  selectedStaff,
}) {
  return (
    <div>
      <div className="mb-5">
        <label
          htmlFor="admin-staff-select"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          編集する職員
        </label>

        <select
          id="admin-staff-select"
          value={selectedStaffId}
          onChange={(event) => setSelectedStaffId(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          {editableStaffs.length === 0 && (
            <option value="">編集できる職員がいません</option>
          )}

          {editableStaffs.map((staff) => (
            <option key={staff.id} value={staff.id}>
              {staff.name || `職員ID: ${staff.id}`}
            </option>
          ))}
        </select>
      </div>

      {selectedStaffId && (
        <>
          <div className="mb-5 flex gap-2 border-b border-gray-200">
            {STAFF_SECTIONS.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveStaffSection(id)}
                className={`border-b-2 px-4 py-2 text-sm font-medium ${
                  activeStaffSection === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {activeStaffSection === 'base' ? (
            <Base staffId={selectedStaffId} />
          ) : (
            <Login staff={selectedStaff} />
          )}
        </>
      )}
    </div>
  )
}
