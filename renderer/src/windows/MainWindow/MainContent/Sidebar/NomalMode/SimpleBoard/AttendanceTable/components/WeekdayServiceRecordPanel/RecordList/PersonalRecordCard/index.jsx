/** 個人記録1件分の表示。今後の操作ボタン・詳細表示もこのコンポーネントに追加する。 */
export default function PersonalRecordCard({ record }) {
  const status = Number(record?.status) === 2 ? '下書き' : Number(record?.status) === 1 ? '公開' : '状態未設定';
  return (
    <article className="rounded-md border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-sm font-semibold text-slate-800">{record?.children_name || `児童ID: ${record?.children_id ?? '不明'}`}</span>
        <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{status}</span>
      </div>
      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-slate-800">{record?.note || '記録本文なし'}</p>
    </article>
  );
}
