import { ArrowUpTrayIcon } from '@heroicons/react/24/outline'

export default function SavePersonRecordButton({
  onClick,
  sending = false,
  disabled = false,
  count = 0,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || sending}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      title="取得した個人記録をLaravelへ一括保存"
    >
      <ArrowUpTrayIcon
        className={`h-5 w-5 shrink-0 ${sending ? 'animate-pulse' : ''}`}
      />
      <span>
        {sending ? `送信中... (${count}件)` : `Laravelへ一括保存 (${count}件)`}
      </span>
    </button>
  )
}
