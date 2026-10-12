import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  checkForUpdates,
  displayUpdateInfo,
  getUpdateInfo,
} from './updateManager.js'

import DownloadProgressRow from '@/components/ui/DownloadProgressRow'

function UpdateTab() {
  const [updateInfo, setUpdateInfo] =
    useState(null)

  const [logs, setLogs] = useState([
    'アプリ起動中...',
  ])

  const [isChecking, setIsChecking] =
    useState(false)

  const logContainerRef = useRef(null)

  /**
   * 更新情報取得処理の重複実行を防止する
   */
  const isRefreshingRef =
    useRef(false)

  const addLog = useCallback(
    (message) => {
      const timestamp =
        new Date().toLocaleTimeString()

      const logMessage =
        `[${timestamp}] ${message}`

      setLogs((previous) => {
        const nextLogs = [
          ...previous,
          logMessage,
        ]

        return nextLogs.length > 50
          ? nextLogs.slice(-50)
          : nextLogs
      })
    },
    []
  )

  /**
   * ログ追加時に最下部までスクロールする
   */
  useEffect(() => {
    const container =
      logContainerRef.current

    if (!container) {
      return
    }

    container.scrollTop =
      container.scrollHeight
  }, [logs])

  /**
   * アップデート情報を取得する
   *
   * silentがtrueの場合はログを追加しない。
   * 定期取得時にログが増え続けるのを防止する。
   */
  const refreshUpdateInfo =
    useCallback(
      async ({
        silent = false,
      } = {}) => {
        if (
          isRefreshingRef.current
        ) {
          return null
        }

        isRefreshingRef.current =
          true

        try {
          const nextUpdateInfo =
            await getUpdateInfo()

          setUpdateInfo(
            nextUpdateInfo
          )

          if (!silent) {
            addLog(
              '🔄 アップデート情報を更新しました'
            )
          }

          return nextUpdateInfo
        } catch (error) {
          console.error(
            '[UpdateTab] 情報更新エラー:',
            error
          )

          if (!silent) {
            addLog(
              `❌ 情報更新エラー: ${
                error?.message ||
                '不明なエラー'
              }`
            )
          }

          return null
        } finally {
          isRefreshingRef.current =
            false
        }
      },
      [addLog]
    )

  /**
   * 初回表示時にアップデート情報を取得する
   */
  useEffect(() => {
    void refreshUpdateInfo()
  }, [refreshUpdateInfo])

  const downloadProgressValue =
    Number(
      updateInfo?.downloadProgress ??
        0
    )

  const downloadProgress =
    Number.isFinite(
      downloadProgressValue
    )
      ? Math.min(
          100,
          Math.max(
            0,
            downloadProgressValue
          )
        )
      : 0

  const isDownloading =
    downloadProgress > 0 &&
    downloadProgress < 100

  /**
   * アップデート利用可能、またはダウンロード中の場合のみ、
   * 1秒ごとに現在の進捗を取得する。
   */
  const shouldPollUpdateInfo =
    Boolean(
      updateInfo?.updateAvailable
    ) ||
    isDownloading

  useEffect(() => {
    if (
      !shouldPollUpdateInfo ||
      downloadProgress >= 100
    ) {
      return undefined
    }

    const intervalId =
      window.setInterval(() => {
        void refreshUpdateInfo({
          silent: true,
        })
      }, 1000)

    return () => {
      window.clearInterval(
        intervalId
      )
    }
  }, [
    shouldPollUpdateInfo,
    downloadProgress,
    refreshUpdateInfo,
  ])

  /**
   * アップデートが利用可能、または進捗が存在するときだけ
   * プログレスバーを表示する。
   */
  const shouldShowProgress =
    Boolean(
      updateInfo?.updateAvailable
    ) ||
    downloadProgress > 0

  const handleManualCheck =
    async () => {
      if (isChecking) {
        return
      }

      setIsChecking(true)

      try {
        addLog(
          '🔄 手動アップデートチェックを開始...'
        )

        const result =
          await checkForUpdates()

        if (result) {
          addLog(
            `✅ 手動チェック完了: ${JSON.stringify(
              result
            )}`
          )
        } else {
          addLog(
            '⚠️ 手動チェック結果なし'
          )
        }

        /**
         * 手動チェック完了のログがすでにあるため、
         * 情報取得時のログは追加しない。
         */
        await refreshUpdateInfo({
          silent: true,
        })
      } catch (error) {
        console.error(
          '[UpdateTab] 手動チェックエラー:',
          error
        )

        addLog(
          `❌ 手動チェックエラー: ${
            error?.message ||
            '不明なエラー'
          }`
        )
      } finally {
        setIsChecking(false)
      }
    }

  const handleShowDebugConsole =
    async () => {
      try {
        const debugInfo =
          await getUpdateInfo()

        displayUpdateInfo(
          debugInfo
        )

        addLog(
          '📊 デバッグ情報をコンソールに表示しました'
        )
      } catch (error) {
        console.error(
          '[UpdateTab] デバッグ表示エラー:',
          error
        )

        addLog(
          `❌ デバッグ表示エラー: ${
            error?.message ||
            '不明なエラー'
          }`
        )
      }
    }

  return (
    <div>
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg text-gray-700">
        🔧 アップデートデバッグ
      </h3>

      <div className="mb-6">
        <div className="my-2.5 rounded-lg border border-gray-200 bg-gray-100 p-4">
          <InfoRow
            label="📊 現在のバージョン:"
            value={
              updateInfo?.currentVersion ||
              '読み込み中...'
            }
          />

          <InfoRow
            label="🔍 チェック中:"
            value={
              updateInfo
                ? updateInfo.isChecking
                  ? 'はい'
                  : 'いいえ'
                : '読み込み中...'
            }
          />

          <InfoRow
            label="📅 最終チェック時刻:"
            value={
              updateInfo?.lastCheckTime
                ? new Date(
                    updateInfo.lastCheckTime
                  ).toLocaleString()
                : '未実行'
            }
          />

          <InfoRow
            label="🔢 チェック回数:"
            value={
              updateInfo?.checkCount ??
              0
            }
          />

          <InfoRow
            label="🆕 新しいバージョン:"
            value={
              updateInfo?.newVersion ||
              'なし'
            }
          />

          <InfoRow
            label="✅ アップデート利用可能:"
            value={
              updateInfo
                ? updateInfo.updateAvailable
                  ? '⭐はい'
                  : 'いいえ'
                : '読み込み中...'
            }
          />

          {shouldShowProgress && (
            <DownloadProgressRow
              value={
                downloadProgress
              }
              isLoading={
                !updateInfo
              }
            />
          )}

          {updateInfo?.lastError && (
            <InfoRow
              label="❌ 最後のエラー:"
              value={
                updateInfo.lastError
              }
            />
          )}
        </div>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 font-semibold text-gray-700">
          操作
        </h4>

        <div className="my-4 flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={
              handleManualCheck
            }
            disabled={isChecking}
            className="min-w-[120px] flex-1 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isChecking
              ? '🔄 チェック中...'
              : '🔄 手動チェック'}
          </button>

          <button
            type="button"
            onClick={
              handleShowDebugConsole
            }
            className="min-w-[120px] flex-1 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white"
          >
            📊 コンソール表示
          </button>

          <button
            type="button"
            onClick={() => {
              void refreshUpdateInfo()
            }}
            className="min-w-[120px] flex-1 rounded-md bg-gray-600 px-3 py-2 text-sm font-medium text-white"
          >
            🔄 情報更新
          </button>
        </div>
      </div>

      <div className="mb-6">
        <a
          href="https://github.com/higayu/hug-client/releases"
          target="_blank"
          rel="noreferrer"
          className="text-blue-600 underline hover:text-blue-800"
        >
          リリースバージョンのリンク
        </a>
      </div>

      <div className="mb-6">
        <h4 className="mb-3 font-semibold text-gray-700">
          ログ
        </h4>

        <div
          ref={logContainerRef}
          className="max-h-[200px] overflow-y-auto rounded-md bg-gray-900 p-4 font-mono text-xs leading-snug text-white"
        >
          {logs.map(
            (log, index) => (
              <div
                key={`${index}-${log}`}
                className="my-0.5 py-0.5 text-white"
              >
                {log}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function InfoRow({
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-gray-200 py-2 font-mono text-sm last:border-b-0">
      <strong className="min-w-[180px] text-gray-700">
        {label}
      </strong>

      <span className="break-all text-right font-medium text-gray-600">
        {String(value)}
      </span>
    </div>
  )
}

export default UpdateTab