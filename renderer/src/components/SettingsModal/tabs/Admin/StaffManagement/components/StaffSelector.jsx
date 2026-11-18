import { useEffect, useMemo, useState } from 'react'

const normalizeSearchText = (value) =>
  String(value ?? '')
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ja')

export default function StaffSelector({
  staffs,
  selectedStaffId,
  onChangeStaffId,
}) {
  const [searchText, setSearchText] = useState('')
  const normalizedQuery = normalizeSearchText(searchText)

  const filteredStaffs = useMemo(() => {
    if (!normalizedQuery) return staffs

    return staffs.filter((staff) =>
      [staff?.name, staff?.id, staff?.login_id].some((value) =>
        normalizeSearchText(value).includes(normalizedQuery),
      ),
    )
  }, [staffs, normalizedQuery])

  useEffect(() => {
    if (filteredStaffs.some(
      (staff) => String(staff.id) === String(selectedStaffId),
    )) return

    // 該当なしの場合は親側の自動選択と空選択が競合するため、
    // 現在の選択を維持する。
    if (filteredStaffs.length === 0) return

    const nextStaffId = String(filteredStaffs[0].id)

    if (String(selectedStaffId) !== nextStaffId) {
      onChangeStaffId(nextStaffId)
    }
  }, [filteredStaffs, selectedStaffId, onChangeStaffId])

  return (
    <div className="mb-5 space-y-3">
      <div>
        <label
          htmlFor="admin-staff-search"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          職員を検索
        </label>

        <input
          id="admin-staff-search"
          type="search"
          value={searchText}
          placeholder="氏名・職員ID・ログインIDで検索"
          autoComplete="off"
          onChange={(event) => setSearchText(event.target.value)}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />

        <p className="mt-1 text-xs text-gray-500">
          {filteredStaffs.length} / {staffs.length}件
        </p>
      </div>

      <div>
      <label
        htmlFor="admin-staff-select"
        className="mb-1 block text-sm font-medium text-gray-700"
      >
        編集する職員
      </label>

      <select
        id="admin-staff-select"
        value={selectedStaffId}
        onChange={(event) => onChangeStaffId(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {filteredStaffs.length === 0 && (
          <option value="">
            {staffs.length === 0
              ? '編集できる職員がいません'
              : '検索条件に一致する職員がいません'}
          </option>
        )}

        {filteredStaffs.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.name || `職員ID: ${staff.id}`}（ID: {staff.id}）
          </option>
        ))}
      </select>
      </div>
    </div>
  )
}
