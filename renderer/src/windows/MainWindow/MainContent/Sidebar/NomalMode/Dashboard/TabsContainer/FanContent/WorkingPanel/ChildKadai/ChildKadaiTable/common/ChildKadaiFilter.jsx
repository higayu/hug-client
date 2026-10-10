function ChildKadaiFilter({
  selectedChildName,
  selectedChildId,
  filterRecordTypeId,
  setFilterRecordTypeId,
  recordTypes,
  loading,
  onLoad,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-end gap-4">
      <div className="text-sm font-medium">
        <span className="mb-1 block">児童</span>
        <div className="min-w-48 rounded border bg-gray-50 px-3 py-1 text-gray-800">
          {selectedChildName || `児童ID: ${selectedChildId}`}
        </div>
      </div>

      <label className="text-sm font-medium">
        <span className="mb-1 block">課題のタイプ</span>
        <select
          value={filterRecordTypeId}
          onChange={(event) => setFilterRecordTypeId(event.target.value)}
          className="w-48 rounded border px-3 py-1"
        >
          <option value="">選択してください</option>
          {recordTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
      </label>

      <button
        type="button"
        onClick={onLoad}
        disabled={!filterRecordTypeId || loading}
        className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
      >
        {loading ? '取得中...' : '取得する'}
      </button>
    </div>
  )
}

export default ChildKadaiFilter
