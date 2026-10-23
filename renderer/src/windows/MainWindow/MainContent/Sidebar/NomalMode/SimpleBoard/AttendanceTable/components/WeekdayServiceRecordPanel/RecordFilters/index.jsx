export default function RecordFilters({ visibleChildren, selectedChildId, onChildChange, weekdayDates, selectedDate, onDateChange }) {
  return (
    <div className="border-t border-sky-200 bg-sky-50 px-3 py-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-xs font-semibold text-slate-700">
          児童（入退室テーブルに表示中）
          <select value={selectedChildId} onChange={(event) => onChildChange(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-800 focus:border-sky-500 focus:outline-none">
            <option value="all">表示中の児童すべて（{visibleChildren.length}人）</option>
            {visibleChildren.map((child) => <option key={child.id} value={child.id}>{child.name}</option>)}
          </select>
        </label>
        <label className="flex min-w-[160px] flex-1 flex-col gap-1 text-xs font-semibold text-slate-700">
          日付（選択曜日のみ）
          <select value={selectedDate} onChange={(event) => onDateChange(event.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-2 text-sm font-normal text-slate-800 focus:border-sky-500 focus:outline-none">
            {weekdayDates.map((date) => <option key={date} value={date}>{date}</option>)}
          </select>
        </label>
      </div>
    </div>
  );
}
