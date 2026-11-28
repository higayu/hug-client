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
        void 0

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

        void 0

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
          void 0

          return
        }

        /*
         * 新しいバージョンあり
         */
        void 0

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

        void 0

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

        void 0

        if (
          !downloadResult?.success
        ) {
          throw new Error(
            downloadResult?.message ??
              'アップデートのダウンロードに失敗しました。',
          )
        }

        setDownloadProgress(100)

        void 0

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

        void 0

        const installResult =
          await window.electronAPI
            .installDownloadedUpdate()

        void 0

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
            void 0

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