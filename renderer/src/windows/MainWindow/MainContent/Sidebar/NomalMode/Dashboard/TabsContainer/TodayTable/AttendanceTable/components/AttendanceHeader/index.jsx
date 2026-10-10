import GetTodayUsersChildren from '@/components/common/hug_function/GetTodayUsersChildren';

const SIMPLE_BOARD_FILTER_OPTIONS = [
  { value: 0, label: '全件' },
  { value: 1, label: '退室済み以外' },
  { value: 2, label: '退室済みと欠席以外' },
  { value: 3, label: '欠席' },
  { value: 4, label: '退室済み' },
];

export default function AttendanceHeader({
  lastUpdatedAt,
  totalCount = 0,
  filteredCount = 0,
  filterMode = 0,
  onFilterModeChange,
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-[320px] flex-1">
        <GetTodayUsersChildren
          expandDirection="down"
          filterOptions={SIMPLE_BOARD_FILTER_OPTIONS}
          filterMode={filterMode}
          onFilterModeChange={onFilterModeChange}
          variant="simpleBoard"
        />
      </div>

      <div
        className="shrink-0 rounded bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700"
        title={lastUpdatedAt ? `最終取得: ${lastUpdatedAt}` : undefined}
      >
        表示 {filteredCount} / {totalCount} 件
      </div>
    </div>
  );
}
