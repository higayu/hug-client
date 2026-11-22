export default function UpdateNotificationModal({
  isOpen,
  updateInfo,
  isDownloading,
  downloadProgress,
  updateError,
  onClose,
  onUpdate,
}) {
  if (
    !isOpen ||
    !updateInfo
  ) {
    return null
  }

  const currentVersion =
    updateInfo.current_version ??
    '-'

  const latestVersion =
    updateInfo.latest_version ??
    '-'

  const releaseNote =
    updateInfo.release_note ??
    ''

  const updateRequired =
    Boolean(
      updateInfo.update_required,
    )

  const forceUpdate =
    Boolean(
      updateInfo.force_update,
    )

  return (
    <div
      className="
        fixed inset-0 z-[99999]
        flex items-center justify-center
        bg-black/50
        p-4
      "
    >
      <div
        className="
          w-full max-w-lg
          rounded-xl
          bg-white
          p-6
          shadow-2xl
        "
      >
        {/* タイトル */}
        <div className="mb-5">
          <h2
            className="
              text-xl
              font-bold
              text-gray-900
            "
          >
            新しいバージョンがあります
          </h2>

          <p
            className="
              mt-2
              text-sm
              text-gray-600
            "
          >
            新しいバージョン
            {' '}
            <strong>
              {latestVersion}
            </strong>
            {' '}
            が利用できます。
          </p>
        </div>

        {/* バージョン */}
        <div
          className="
            mb-4
            rounded-lg
            bg-gray-50
            p-4
          "
        >
          <div
            className="
              flex
              items-center
              justify-between
              py-1
            "
          >
            <span
              className="
                text-sm
                text-gray-600
              "
            >
              現在のバージョン
            </span>

            <strong>
              {currentVersion}
            </strong>
          </div>

          <div
            className="
              flex
              items-center
              justify-between
              py-1
            "
          >
            <span
              className="
                text-sm
                text-gray-600
              "
            >
              最新バージョン
            </span>

            <strong
              className="
                text-blue-600
              "
            >
              {latestVersion}
            </strong>
          </div>
        </div>

        {/* 必須アップデート */}
        {updateRequired && (
          <div
            className="
              mb-4
              rounded-lg
              border
              border-orange-200
              bg-orange-50
              p-3
              text-sm
              text-orange-800
            "
          >
            {forceUpdate
              ? 'このアップデートは必須です。'
              : '現在のバージョンは最低利用可能バージョンを下回っています。アップデートを推奨します。'}
          </div>
        )}

        {/* リリースノート */}
        {releaseNote && (
          <div className="mb-4">
            <div
              className="
                mb-2
                text-sm
                font-semibold
                text-gray-700
              "
            >
              更新内容
            </div>

            <div
              className="
                max-h-40
                overflow-y-auto
                whitespace-pre-wrap
                rounded-lg
                border
                border-gray-200
                bg-white
                p-3
                text-sm
                text-gray-700
              "
            >
              {releaseNote}
            </div>
          </div>
        )}

        {/* ダウンロード進捗 */}
        {isDownloading && (
          <div className="mb-4">
            <div
              className="
                mb-1
                flex
                justify-between
                text-sm
                text-gray-600
              "
            >
              <span>
                アップデートをダウンロード中...
              </span>

              <span>
                {downloadProgress}%
              </span>
            </div>

            <div
              className="
                h-2
                w-full
                overflow-hidden
                rounded-full
                bg-gray-200
              "
            >
              <div
                className="
                  h-full
                  bg-blue-600
                  transition-all
                  duration-200
                "
                style={{
                  width:
                    `${downloadProgress}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* エラー */}
        {updateError && (
          <div
            className="
              mb-4
              rounded-lg
              border
              border-red-200
              bg-red-50
              p-3
              text-sm
              text-red-700
            "
          >
            {updateError}
          </div>
        )}

        {/* ボタン */}
        <div
          className="
            flex
            justify-end
            gap-3
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isDownloading}
            className="
              rounded-lg
              border
              border-gray-300
              px-4
              py-2
              text-sm
              font-medium
              text-gray-700
              hover:bg-gray-50
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            後で
          </button>

          <button
            type="button"
            onClick={onUpdate}
            disabled={isDownloading}
            className="
              rounded-lg
              bg-blue-600
              px-5
              py-2
              text-sm
              font-semibold
              text-white
              hover:bg-blue-700
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            {isDownloading
              ? `ダウンロード中 ${downloadProgress}%`
              : 'アップデート'}
          </button>
        </div>
      </div>
    </div>
  )
}