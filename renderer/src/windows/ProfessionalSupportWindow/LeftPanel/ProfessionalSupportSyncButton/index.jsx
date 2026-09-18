export default function ProfessionalSupportSyncButton({
  onClick,
  disabled,
  syncing,
  progressText,
  syncMessage,
  syncError,
}) {
  return (
    <div>
      <div className="flex items-center justify-start gap-2">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || syncing}
          className="rounded bg-blue-600 px-3 py-3 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {syncing
            ? progressText || 'HUGから取得・DB保存中...'
            : 'HUGから再取得してDBへ保存'}
        </button>
      </div>

      {syncMessage && (
        <p className="mt-2 text-right text-xs text-green-700">
          {syncMessage}
        </p>
      )}

      {syncError && (
        <p className="mt-2 text-right text-xs text-red-600">
          {syncError}
        </p>
      )}
    </div>
  )
}
