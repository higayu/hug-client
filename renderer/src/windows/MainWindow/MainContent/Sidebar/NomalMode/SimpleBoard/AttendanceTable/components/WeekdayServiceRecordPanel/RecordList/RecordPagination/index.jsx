/** 個人記録の1件単位ページ送り。 */
export default function RecordPagination({ page, total, onPageChange }) {
  if (total <= 1) return null;
  return (
    <nav className="flex items-center justify-center gap-3" aria-label="個人記録のページ切り替え">
      <button type="button" onClick={() => onPageChange(Math.max(0, page - 1))} disabled={page <= 0}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">← 前へ</button>
      <span className="min-w-20 text-center text-sm text-slate-700" aria-live="polite">{page + 1} / {total}</span>
      <button type="button" onClick={() => onPageChange(Math.min(total - 1, page + 1))} disabled={page >= total - 1}
        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">次へ →</button>
    </nav>
  );
}
