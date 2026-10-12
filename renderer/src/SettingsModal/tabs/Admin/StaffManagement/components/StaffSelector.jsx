export default function StaffSelector({
  staffs,
  selectedStaffId,
  onChangeStaffId,
}) {
  return (
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
        onChange={(event) => onChangeStaffId(event.target.value)}
        className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
      >
        {staffs.length === 0 && (
          <option value="">編集できる職員がいません</option>
        )}

        {staffs.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.name || `職員ID: ${staff.id}`}
          </option>
        ))}
      </select>
    </div>
  )
}
