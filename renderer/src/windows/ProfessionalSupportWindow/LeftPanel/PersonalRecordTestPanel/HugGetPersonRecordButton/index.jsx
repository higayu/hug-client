import { ArrowDownTrayIcon } from '@heroicons/react/24/outline'

import { buildPersonalRecordFetchScript } from './personalRecord'
import { fetchPersonalRecordDetails } from './fetchPersonalRecordDetails'

export default function HugGetPersonRecordButton({
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
  loading = false,
  sending = false,
  setLoading,
  setError,
  setData,
  setSendError,
  setSendResult,
}) {
  const handleClick = async () => {
    if (loading || sending) return

    if (!facilityId) {
      setError?.('施設を選択してください。')
      return
    }

    const webview = webviewRef?.current

    if (
      !webviewReady ||
      !webview ||
      typeof webview.executeJavaScript !== 'function'
    ) {
      setError?.(
        'HUGのWebViewがまだ準備できていません。HUG画面の読み込み完了後に、もう一度実行してください。',
      )
      return
    }

    setLoading?.(true)
    setError?.('')
    setSendError?.('')
    setSendResult?.(null)

    try {
      // 1. contact_book.php の一覧を取得
      const script = buildPersonalRecordFetchScript({
        facilityId,
        year,
        month,
      })

      const listResult = await webview.executeJavaScript(script, true)

      if (listResult?.ok === false) {
        throw new Error(
          listResult.error || '個人記録一覧の取得に失敗しました。',
        )
      }

      const listRecords = Array.isArray(listResult?.records)
        ? listResult.records
        : []

      // 2. 各編集画面を取得し、個人記録本文(note)を取得
      const detailResult = await fetchPersonalRecordDetails(
        webview,
        listRecords,
      )

      const mergedData = {
        ...listResult,
        records: detailResult.records ?? listRecords,
        detailCount: detailResult.detailCount ?? 0,
        detailErrorCount: detailResult.errorCount ?? 0,
        permissionErrorCount: detailResult.permissionErrorCount ?? 0,
        detailFetchOk: detailResult.ok,
        detailFetchError: detailResult.ok ? '' : detailResult.error,
      }

      setData?.(mergedData)

      if (!detailResult.ok) {
        setError?.(
          `一覧は取得できましたが、本文取得でエラーが発生しました: ${detailResult.error}`,
        )
      }
    } catch (fetchError) {
      console.error(
        '[ProfessionalSupportWindow] 個人記録テスト取得エラー:',
        fetchError,
      )

      setData?.(null)
      setError?.(
        fetchError?.message ?? '個人記録のテスト取得に失敗しました。',
      )
    } finally {
      setLoading?.(false)
    }
  }

  const isWebviewAvailable =
    webviewReady &&
    webviewRef?.current &&
    typeof webviewRef.current.executeJavaScript === 'function'

  const disabled =
    loading ||
    sending ||
    !facilityId ||
    !isWebviewAvailable

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-gray-300"
      title="HUGから個人記録の一覧と本文を取得"
    >
      <ArrowDownTrayIcon
        className={`h-5 w-5 shrink-0 ${loading ? 'animate-pulse' : ''}`}
      />
      <span>
        {loading ? '一覧＋本文を取得中...' : '個人記録を取得'}
      </span>
    </button>
  )
}
