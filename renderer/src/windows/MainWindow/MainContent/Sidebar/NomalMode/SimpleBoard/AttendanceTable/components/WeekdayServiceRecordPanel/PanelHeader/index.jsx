export default function PanelHeader({ embedded, expanded, onToggle, month, weekdayLabel, loading, filteredCount, totalCount, onRefresh }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
      {embedded ? (
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          選択曜日の個人記録
          <span className="text-xs font-normal text-slate-600">{month || '年月未設定'} / {weekdayLabel ?? '曜日未設定'}曜日</span>
        </div>
      ) : (
        <button type="button" onClick={onToggle} aria-expanded={expanded}
          className="flex items-center gap-2 text-left text-sm font-semibold text-slate-800 hover:text-sky-700">
          <span aria-hidden="true">{expanded ? '▼' : '▶'}</span>
          選択曜日の個人記録
          <span className="text-xs font-normal text-slate-600">{month || '年月未設定'} / {weekdayLabel ?? '曜日未設定'}曜日</span>
        </button>
      )}
      {expanded && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600">{loading ? '取得中…' : `${filteredCount}件 / 取得${totalCount}件`}</span>
          <button type="button" onClick={onRefresh} disabled={loading}
            className="rounded border border-sky-300 bg-white px-2 py-1 text-xs font-semibold text-sky-800 hover:bg-sky-100 disabled:opacity-50">再取得</button>
        </div>
      )}
    </div>
  );
}
