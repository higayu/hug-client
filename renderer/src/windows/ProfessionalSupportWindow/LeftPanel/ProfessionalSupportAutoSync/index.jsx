import { useEffect, useRef } from 'react'

export default function ProfessionalSupportAutoSync({
  facilityId,
  year,
  month,
  webviewReady,
  syncStatusChecked,
  isMonthSynced,
  comparisonLoading,
  comparisonError,
  syncing,
  runSync,
  clearSyncStatus,
}) {
  const autoSyncAttemptedKeyRef = useRef('')

  // 施設・年月が変わった場合は、その月の自動同期試行状態をリセットする。
  useEffect(() => {
    autoSyncAttemptedKeyRef.current = ''
    clearSyncStatus?.()
  }, [facilityId, year, month, clearSyncStatus])

  // DBに未同期の月だけ、WebView準備完了後に1回だけ自動同期する。
  useEffect(() => {
    if (
      !facilityId ||
      !webviewReady ||
      !syncStatusChecked ||
      isMonthSynced ||
      Boolean(comparisonError) ||
      comparisonLoading ||
      syncing
    ) {
      return
    }

    const syncKey = `${facilityId}-${year}-${month}`

    if (autoSyncAttemptedKeyRef.current === syncKey) {
      return
    }

    autoSyncAttemptedKeyRef.current = syncKey
    runSync()
  }, [
    facilityId,
    year,
    month,
    webviewReady,
    syncStatusChecked,
    isMonthSynced,
    comparisonError,
    comparisonLoading,
    syncing,
    runSync,
  ])

  return null
}
