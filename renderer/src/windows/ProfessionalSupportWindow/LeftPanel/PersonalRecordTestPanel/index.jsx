import { useMemo, useState } from 'react'

import { useAppState } from '@/AppStateContext'

import AllSyncButton from '@/components/common/Synchronization/AllSyncButton'

import ResultPanel from './ResultPanel'

const PERSONAL_RECORD_ITEM_ID = 1


const toPersonalRecordStatus = (record) => {
  const statusText = String(record?.status ?? '')
    .replace(/\s+/g, '')
    .trim()

  const statusClass = String(record?.statusClass ?? '')
    .toLowerCase()
    .trim()

  if (statusText === '1') {
    return 1
  }

  if (statusText === '2') {
    return 2
  }

  if (statusText === '公開中' || statusText === '公開') {
    return 1
  }

  if (statusText === '下書き') {
    return 2
  }

  if (statusClass.split(/\s+/).includes('open')) {
    return 1
  }

  return null
}


const normalizeConditionText = (value) =>
  String(value ?? '')
    .replace(/\s+/g, '')
    .trim()

const getPersonalRecordSkipReason = (record) => {
  const attendance = normalizeConditionText(record?.attendance)
  const status = normalizeConditionText(record?.status)

  if (attendance === '欠席' || attendance.startsWith('欠席(')) {
    return attendance.includes('欠席時対応加算を取らない')
      ? '欠席（欠席時対応加算を取らない）'
      : '欠席'
  }

  if (status === '未作成') {
    return '状態が未作成'
  }

  return ''
}

const toBulkRecord = (record, facilityId) => {
  if (getPersonalRecordSkipReason(record)) {
    return null
  }

  const childrenId = Number(record?.childrenId)
  const normalizedFacilityId = Number(facilityId)
  const servedDate = String(record?.date ?? '').trim()

  if (!Number.isInteger(childrenId) || childrenId <= 0) {
    return null
  }

  if (!Number.isInteger(normalizedFacilityId) || normalizedFacilityId <= 0) {
    return null
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(servedDate)) {
    return null
  }

  if (
    record?.note === null ||
    record?.note === undefined ||
    record?.noteError
  ) {
    return null
  }

  const recordStaffId = Number(record?.recordStaffId)

  return {
    children_id: childrenId,
    item_id: PERSONAL_RECORD_ITEM_ID,
    served_date: servedDate,
    facility_id: normalizedFacilityId,
    note: String(record.note),
    status: toPersonalRecordStatus(record),
    is_copy: 0,
    is_deleted: 0,
    recorded_staff_id:
      Number.isInteger(recordStaffId) && recordStaffId > 0
        ? recordStaffId
        : null,
  }
}

export default function PersonalRecordTestPanel({
  webviewRef,
  webviewReady,
  facilityId,
  year,
  month,
}) {
  const { STAFF_ID } = useAppState()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  const [sending, setSending] = useState(false)
  const [sendError, setSendError] = useState('')
  const [sendResult, setSendResult] = useState(null)

  const currentWebview = webviewRef?.current ?? null

  const isWebviewAvailable =
    webviewReady &&
    currentWebview &&
    typeof currentWebview.executeJavaScript === 'function'

  const records = Array.isArray(data?.records)
    ? data.records
    : []

  const bulkRecords = useMemo(
    () =>
      records
        .map((record) => toBulkRecord(record, facilityId))
        .filter(Boolean),
    [facilityId, records],
  )

  const conditionSkippedCount = records.filter((record) =>
    Boolean(getPersonalRecordSkipReason(record)),
  ).length

  const skippedSendCount = Math.max(
    records.length - bulkRecords.length,
    0,
  )

  return (
    <section className="border-b border-amber-200 bg-amber-50 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-amber-900">
            個人記録取得テスト
          </h3>

          <p className="mt-1 text-xs text-amber-700">
            職員・児童同期後、個人記録を取得してLaravelへ保存します。
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AllSyncButton
            webviewRef={webviewRef}
            webviewReady={webviewReady}
            webview={currentWebview}
            facilityId={facilityId}
            year={year}
            month={month}
            loading={loading}
            sending={sending}
            setLoading={setLoading}
            setSending={setSending}
            setError={setError}
            setData={setData}
            setSendError={setSendError}
            setSendResult={setSendResult}
            disabled={
              loading ||
              sending ||
              !facilityId ||
              !isWebviewAvailable
            }
            className="flex items-center justify-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          />
        </div>
      </div>

      <ResultPanel
        error={error}
        sendError={sendError}
        sendResult={sendResult}
        data={data}
        records={records}
        bulkRecords={bulkRecords}
        conditionSkippedCount={conditionSkippedCount}
        skippedSendCount={skippedSendCount}
        staffId={STAFF_ID}
        facilityId={facilityId}
        getPersonalRecordSkipReason={getPersonalRecordSkipReason}
        toBulkRecord={toBulkRecord}
      />
    </section>
  )
}