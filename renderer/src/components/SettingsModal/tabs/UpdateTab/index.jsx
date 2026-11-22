import {
  useCallback,
  useEffect,
  useState,
} from 'react'

export default function UpdateTab() {
  const [updateInfo, setUpdateInfo] =
    useState(null)

  const [checking, setChecking] =
    useState(false)

  const [downloading, setDownloading] =
    useState(false)

  const [downloadProgress, setDownloadProgress] =
    useState(0)

  const [downloadedPath, setDownloadedPath] =
    useState(null)

  const [error, setError] =
    useState('')

  const [debugResult, setDebugResult] = useState(null)
  const [debugDownloading, setDebugDownloading] = useState(false)

  // 開発時だけ表示。Main側にも app.isPackaged による制限が必要。
  const isDev = import.meta.env.DEV

  /**
   * Laravelへ最新版確認
   */
  const checkUpdate = useCallback(async () => {
    if (
      !window.electronAPI
        ?.checkForUpdates
    ) {
      setError(
        'アップデート確認APIが利用できません。',
      )
      return
    }

    setChecking(true)
    setError('')

    try {
      const result =
        await window.electronAPI
          .checkForUpdates()

      console.log(
        '[UpdateTab] check result:',
        result,
      )

      if (!result?.success) {
        throw new Error(
          result?.message ||
            'アップデート確認に失敗しました。',
        )
      }

      setUpdateInfo(result)
    } catch (err) {
      console.error(
        '[UpdateTab] update check error:',
        err,
      )

      setError(
        err?.message ||
          'アップデート確認に失敗しました。',
      )
    } finally {
      setChecking(false)
    }
  }, [])

  /**
   * タブ初回表示時
   */
  useEffect(() => {
    void checkUpdate()
  }, [checkUpdate])

  /**
   * ダウンロード進捗
   */
  useEffect(() => {
    if (
      !window.electronAPI
        ?.onUpdateDownloadProgress
    ) {
      return undefined
    }

    const unsubscribe =
      window.electronAPI
        .onUpdateDownloadProgress(
          (progress) => {
            const percent =
              Number(
                progress?.percent ??
                  progress ??
                  0,
              )

            setDownloadProgress(
              Math.max(
                0,
                Math.min(100, percent),
              ),
            )
          },
        )

    return typeof unsubscribe ===
      'function'
      ? unsubscribe
      : undefined
  }, [])

  /**
   * 最新インストーラーDL
   */
  const downloadUpdate = async () => {
    if (
      !window.electronAPI
        ?.downloadLatestUpdate
    ) {
      setError(
        'ダウンロードAPIが利用できません。',
      )
      return
    }

    setDownloading(true)
    setDownloadProgress(0)
    setDownloadedPath(null)
    setError('')

    try {
      const result =
        await window.electronAPI
          .downloadLatestUpdate()

      if (!result?.success) {
        throw new Error(
          result?.message ||
            'ダウンロードに失敗しました。',
        )
      }

      setDownloadedPath(
        result.filePath ?? null,
      )

      setDownloadProgress(100)
    } catch (err) {
      console.error(
        '[UpdateTab] download error:',
        err,
      )

      setError(
        err?.message ||
          'ダウンロードに失敗しました。',
      )
    } finally {
      setDownloading(false)
    }
  }

  /**
   * 開発環境専用: 更新可否に関係なく最新EXEを取得してSHA-256を検証。
   * 失敗したファイルはmain側が .sha256-failed として保管する。
   * 調査用ファイルはインストーラーとして扱わない。
   */
  const forceDownloadForDebug = async () => {
    const fn = window.api?.forceDownloadLatestUpdateForDebug
    if (!isDev || typeof fn !== 'function') {
      setError('開発用ダウンロードAPIが利用できません。preloadの公開設定を確認してください。')
      return
    }

    setDebugDownloading(true)
    setDownloading(true)
    setDownloadProgress(0)
    setDownloadedPath(null)
    setDebugResult(null)
    setError('')

    try {
      const result = await fn()
      console.log('[UpdateTab] dev force download result:', result)
      setDebugResult(result)
      if (!result?.success) {
        setError(result?.message || 'SHA-256検証に失敗しました。')
        return
      }
      setDownloadProgress(100)
      // 安全のため、調査用ダウンロードから「インストーラーを起動」は有効化しない。
    } catch (err) {
      console.error('[UpdateTab] dev force download error:', err)
      setError(err?.message || '開発用ダウンロードに失敗しました。')
    } finally {
      setDownloading(false)
      setDebugDownloading(false)
    }
  }

  /**
   * DL済みインストーラー起動
   */
  const installUpdate = async () => {
    if (
      !window.electronAPI
        ?.installDownloadedUpdate
    ) {
      setError(
        'インストーラー起動APIが利用できません。',
      )
      return
    }

    try {
      const result =
        await window.electronAPI
          .installDownloadedUpdate()

      if (!result?.success) {
        throw new Error(
          result?.message ||
            'インストーラーを起動できませんでした。',
        )
      }
    } catch (err) {
      console.error(
        '[UpdateTab] install error:',
        err,
      )

      setError(
        err?.message ||
          'インストーラーを起動できませんでした。',
      )
    }
  }

  const currentVersion =
    updateInfo?.current_version ??
    updateInfo?.currentVersion ??
    '-'

  const latestVersion =
    updateInfo?.latest_version ??
    updateInfo?.latestVersion ??
    '-'

  const updateAvailable =
    Boolean(
      updateInfo?.update_available ??
        updateInfo?.updateAvailable,
    )

  const updateRequired =
    Boolean(
      updateInfo?.update_required ??
        updateInfo?.updateRequired ??
        updateInfo?.force_update,
    )

  const releaseNote =
    updateInfo?.release_note ??
    updateInfo?.releaseNote ??
    ''

  return (
    <div>
      <h3 className="mb-4 border-b border-gray-200 pb-2 text-lg font-semibold text-gray-700">
        アプリのアップデート
      </h3>

      <div className="mb-5 rounded-lg border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center justify-between border-b border-gray-200 py-2">
          <span className="font-medium text-gray-700">
            現在のバージョン
          </span>

          <span className="font-mono">
            {currentVersion}
          </span>
        </div>

        <div className="flex items-center justify-between py-2">
          <span className="font-medium text-gray-700">
            最新バージョン
          </span>

          <span className="font-mono">
            {latestVersion}
          </span>
        </div>
      </div>

      {checking && (
        <div className="mb-4 rounded-lg bg-blue-50 p-4 text-blue-700">
          最新バージョンを確認しています...
        </div>
      )}

      {!checking &&
        updateInfo &&
        !updateAvailable && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-4 text-green-700">
            現在のアプリは最新版です。
          </div>
        )}

      {!checking &&
        updateAvailable && (
          <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 font-semibold text-blue-800">
              新しいバージョンがあります
            </div>

            <div className="text-sm text-blue-700">
              {currentVersion}
              {' → '}
              {latestVersion}
            </div>

            {updateRequired && (
              <div className="mt-2 font-semibold text-red-600">
                このアップデートは必須です。
              </div>
            )}
          </div>
        )}

      {releaseNote && (
        <div className="mb-5">
          <h4 className="mb-2 font-semibold text-gray-700">
            更新内容
          </h4>

          <div className="whitespace-pre-wrap rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
            {releaseNote}
          </div>
        </div>
      )}

      {downloading && (
        <div className="mb-5">
          <div className="mb-1 flex justify-between text-sm">
            <span>
              インストーラーをダウンロード中
            </span>

            <span>
              {Math.round(
                downloadProgress,
              )}
              %
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full bg-blue-600 transition-all"
              style={{
                width: `${downloadProgress}%`,
              }}
            />
          </div>
        </div>
      )}

      {downloadedPath && (
        <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          インストーラーのダウンロードが完了しました。
        </div>
      )}

      {error && (
        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {isDev && (
        <div className="mb-5 rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h4 className="mb-2 font-semibold text-amber-900">開発用：SHA-256検証</h4>
          <p className="mb-3 text-sm text-amber-800">
            「最新版です」と表示されていても最新EXEを再ダウンロードします。
            不一致時の調査用ファイルは実行しないでください。
          </p>
          <button
            type="button"
            onClick={() => { void forceDownloadForDebug() }}
            disabled={checking || downloading}
            className="rounded-md bg-amber-700 px-4 py-2 text-sm font-medium text-white hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {debugDownloading ? '検証用ダウンロード中...' : '最新版を強制ダウンロードして検証'}
          </button>
          {debugResult && (
            <div className="mt-3 text-sm text-amber-900">
              <p>{debugResult.success ? '検証に成功しました。' : '検証に失敗しました。'}</p>
              {debugResult.filePath && (
                <p className="mt-1 break-all">保存先: {debugResult.filePath}</p>
              )}
              {debugResult?.diagnosticFilePath && (
                <p className="mt-1 break-all">調査用保存先: {debugResult.diagnosticFilePath}</p>
              )}
              {debugResult.sha256 && (
                <p className="mt-1 break-all">SHA-256: {debugResult.sha256}</p>
              )}
              <p className="mt-1 text-xs">詳細はElectronのmainプロセス側ログを確認してください。</p>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={
            checking ||
            downloading
          }
          className="rounded-md bg-gray-600 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => {
            void checkUpdate()
          }}
        >
          {checking
            ? '確認中...'
            : '最新版を確認'}
        </button>

        {updateAvailable &&
          !downloadedPath && (
            <button
              type="button"
              disabled={downloading || checking}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={() => {
                void downloadUpdate()
              }}
            >
              {downloading
                ? 'ダウンロード中...'
                : `${latestVersion} をダウンロード`}
            </button>
          )}

        {downloadedPath && (
          <button
            type="button"
            className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
            onClick={() => {
              void installUpdate()
            }}
          >
            インストーラーを起動
          </button>
        )}
      </div>
    </div>
  )
}