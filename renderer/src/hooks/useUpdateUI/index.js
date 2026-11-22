import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

export function useUpdateUI() {
  const initializedRef =
    useRef(false)

  const [updateInfo, setUpdateInfo] =
    useState(null)

  const [
    isUpdateModalOpen,
    setIsUpdateModalOpen,
  ] = useState(false)

  const [
    isDownloading,
    setIsDownloading,
  ] = useState(false)

  const [
    downloadProgress,
    setDownloadProgress,
  ] = useState(0)

  const [
    updateError,
    setUpdateError,
  ] = useState('')

  /**
   * 起動時アップデート確認
   */
  const checkForUpdates =
    useCallback(async () => {
      try {
        console.log(
          '[Update] 起動時アップデート確認開始',
        )

        if (
          typeof window.electronAPI
            ?.checkForUpdates !==
          'function'
        ) {
          console.warn(
            '[Update] checkForUpdates が利用できません。',
          )

          return
        }

        const result =
          await window.electronAPI
            .checkForUpdates()

        console.log(
          '[Update] 起動時アップデート確認結果:',
          result,
        )

        if (!result?.success) {
          console.warn(
            '[Update] アップデート確認失敗:',
            result?.message ??
              '不明なエラー',
          )

          return
        }

        /*
         * 最新版の場合
         */
        if (
          !result.update_available
        ) {
          console.log(
            '[Update] 現在のアプリは最新版です。',
            {
              currentVersion:
                result.current_version,

              latestVersion:
                result.latest_version,
            },
          )

          return
        }

        /*
         * 新しいバージョンあり
         */
        console.log(
          '[Update] 新しいバージョンがあります。',
          {
            currentVersion:
              result.current_version,

            latestVersion:
              result.latest_version,

            forceUpdate:
              result.force_update,

            updateRequired:
              result.update_required,
          },
        )

        setUpdateInfo(result)

        /*
         * モーダルを開く
         */
        setIsUpdateModalOpen(true)
      } catch (error) {
        console.error(
          '[Update] 起動時アップデート確認エラー:',
          error,
        )
      }
    }, [])

  /**
   * 「後で」
   */
  const closeUpdateModal =
    useCallback(() => {
      if (isDownloading) {
        return
      }

      setIsUpdateModalOpen(false)
    }, [isDownloading])

  /**
   * 「アップデート」
   *
   * ダウンロード
   * ↓
   * インストーラー起動
   */
  const startUpdate =
    useCallback(async () => {
      if (isDownloading) {
        return
      }

      try {
        setUpdateError('')
        setDownloadProgress(0)
        setIsDownloading(true)

        console.log(
          '[Update] 最新版ダウンロード開始',
        )

        if (
          typeof window.electronAPI
            ?.downloadLatestUpdate !==
          'function'
        ) {
          throw new Error(
            'downloadLatestUpdate が利用できません。',
          )
        }

        const downloadResult =
          await window.electronAPI
            .downloadLatestUpdate()

        console.log(
          '[Update] ダウンロード結果:',
          downloadResult,
        )

        if (
          !downloadResult?.success
        ) {
          throw new Error(
            downloadResult?.message ??
              'アップデートのダウンロードに失敗しました。',
          )
        }

        setDownloadProgress(100)

        console.log(
          '[Update] ダウンロード完了',
        )

        /*
         * ダウンロードした
         * インストーラーを起動する。
         */
        if (
          typeof window.electronAPI
            ?.installDownloadedUpdate !==
          'function'
        ) {
          throw new Error(
            'installDownloadedUpdate が利用できません。',
          )
        }

        console.log(
          '[Update] インストーラー起動',
        )

        const installResult =
          await window.electronAPI
            .installDownloadedUpdate()

        console.log(
          '[Update] インストーラー起動結果:',
          installResult,
        )

        if (
          !installResult?.success
        ) {
          throw new Error(
            installResult?.message ??
              'インストーラーの起動に失敗しました。',
          )
        }

        /*
         * main側でアプリ終了まで
         * 行う構成ならここで終了する。
         */
      } catch (error) {
        console.error(
          '[Update] アップデートエラー:',
          error,
        )

        setUpdateError(
          error?.message ??
            'アップデート中にエラーが発生しました。',
        )

        setIsDownloading(false)
      }
    }, [isDownloading])

  /**
   * ダウンロード進捗イベント
   */
  useEffect(() => {
    if (
      typeof window.electronAPI
        ?.onUpdateDownloadProgress !==
      'function'
    ) {
      return undefined
    }

    const removeListener =
      window.electronAPI
        .onUpdateDownloadProgress(
          (progress) => {
            console.log(
              '[Update] download progress:',
              progress,
            )

            /*
             * main側の返却形式に対応
             */
            let percent = 0

            if (
              typeof progress ===
              'number'
            ) {
              percent = progress
            } else if (
              progress &&
              typeof progress ===
                'object'
            ) {
              percent =
                progress.percent ??
                progress.progress ??
                progress.percentage ??
                0
            }

            percent = Number(percent)

            if (
              Number.isFinite(percent)
            ) {
              setDownloadProgress(
                Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round(percent),
                  ),
                ),
              )
            }
          },
        )

    return () => {
      if (
        typeof removeListener ===
        'function'
      ) {
        removeListener()
      }
    }
  }, [])

  /**
   * 起動時に1回だけ確認
   */
  useEffect(() => {
    if (
      initializedRef.current
    ) {
      return
    }

    initializedRef.current = true

    void checkForUpdates()
  }, [checkForUpdates])

  return {
    updateInfo,

    isUpdateModalOpen,

    isDownloading,

    downloadProgress,

    updateError,

    closeUpdateModal,

    startUpdate,
  }
}

export default useUpdateUI