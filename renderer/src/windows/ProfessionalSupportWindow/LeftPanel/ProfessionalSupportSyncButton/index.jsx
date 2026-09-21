import formatSyncedAt from '../utils/formatSyncedAt'

export default function ProfessionalSupportSyncButton({
  onClick,
  disabled,
  syncing,
  progressText,
  syncMessage,
  syncError,
  lastSyncedAt,
}) {
  return (
    <div>
      <div className="flex items-center justify-start gap-3">
        <button
          type="button"
          onClick={onClick}
          disabled={disabled || syncing}
          className="rounded bg-blue-600 px-3 py-3 text-xs font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          title="HUGから再取得してDBへ保存"
        >
          {syncing
            ? progressText || 'HUGから取得・DB保存中...'
            : '支援加算の再取得'}
        </button>

        <div className="whitespace-nowrap text-xs text-gray-500">
          最終取得：
          <span className="ml-1 font-medium text-gray-700">
            {formatSyncedAt(lastSyncedAt)}
          </span>
        </div>
      </div>

      {syncMessage && (
        <p className="mt-2 text-left text-xs text-green-700">
          {syncMessage}
        </p>
      )}

      {syncError && (
        <p className="mt-2 text-left text-xs text-red-600">
          {syncError}
        </p>
      )}
    </div>
  )
}
