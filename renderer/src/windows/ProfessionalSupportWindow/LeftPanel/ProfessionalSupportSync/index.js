import { useCallback, useState } from 'react'

import { executeFlowV2 } from '@/components/WebAutomationV2'
import { buildProfessionalSupportSyncPayload } from '../../syncProfessionalSupport'

export default function useProfessionalSupportSync({
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
  targetDate,
  onFetchStart,
  onFetched,
  onFetchFailed,
  onCompleted,
}) {
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const [syncError, setSyncError] = useState('')
  const [progressText, setProgressText] = useState('')

  const runSync = useCallback(async () => {
    if (!facilityId || !webviewReady || syncing) {
      return false
    }


    const syncApi =
      window.electronAPI?.laravel_procedure_syncProfessionalSupportMonth

    if (typeof syncApi !== 'function') {
      const message = '月次同期APIがpreloadから公開されていません。'
      setSyncError(message)
      return false
    }

    setSyncing(true)
    setSyncMessage('')
    setSyncError('')
    setProgressText('HUGから出席データを取得中...')
    onFetchStart?.()

    try {
      // WebAutomation V2 Flowを順番に実行する。各Flowは同じHUGログイン済みWebViewセッションを使用する。
      const attendanceData = await executeFlowV2(
        'professional_support_attendance_fetch',
        { facilityId, targetDate },
      )

      setProgressText('HUGから加算数データを取得中...')

      const additionCountData = await executeFlowV2(
        'professional_support_addition_count_fetch',
        { facilityId, targetDate },
      )

      setProgressText('HUGから加算一覧データを取得中...')

      const additionListData = await executeFlowV2(
        'professional_support_record_list_fetch',
        { facilityId, targetDate },
      )

      console.log('加算一覧のデータ一括取得結果',additionListData);

      if (!attendanceData || !additionCountData || !additionListData) {
        throw new Error(
          '3種類のデータをすべて取得できなかったため保存を中止しました。',
        )
      }

      onFetched?.({
        attendanceData,
        additionCountData,
        additionListData,
      })

      setProgressText('Laravelへ月次データを保存中...')

      const payload = buildProfessionalSupportSyncPayload({
        facilityId,
        year,
        month,
        attendanceData,
        additionCountData,
        additionListData,
      })

      const result = await syncApi(payload)

      if (!result?.success) {
        throw new Error(
          result?.message || result?.error || '月次データの保存に失敗しました。',
        )
      }

      const counts = result?.data ?? {}

      setSyncMessage(
        `DB保存完了：出席 ${counts.attendance_count ?? payload.attendanceData.length}件 / ` +
          `加算 ${counts.addition_count ?? payload.additionData.length}件 / ` +
          `一覧 ${counts.record_count ?? payload.recordData.length}件`,
      )

      setProgressText('比較データを更新中...')
      await onCompleted?.()
      setProgressText('')

      return true
    } catch (error) {
      console.error(
        '[ProfessionalSupportSync] HUG再取得・月次DB同期エラー:',
        error,
      )

      const message =
        error?.message ?? 'HUGからの再取得または月次データの保存に失敗しました。'

      setSyncError(message)
      setProgressText('')
      onFetchFailed?.(message)

      return false
    } finally {
      setSyncing(false)
    }
  }, [
    facilityId,
    year,
    month,
    targetDate,
    webviewRef,
    webviewReady,
    syncing,
    onFetchStart,
    onFetched,
    onFetchFailed,
    onCompleted,
  ])

  const clearSyncStatus = useCallback(() => {
    setSyncMessage('')
    setSyncError('')
    setProgressText('')
  }, [])

  return {
    runSync,
    syncing,
    syncMessage,
    syncError,
    progressText,
    clearSyncStatus,
  }
}
