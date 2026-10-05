import { ModalPortal } from '@/components/modals/ModalPortal.jsx'

const HOURS = Array.from({ length: 24 }, (_, index) => String(index))
const MINUTES = Array.from({ length: 60 }, (_, index) => String(index))

function TimeSelect({
  label,
  hour,
  minute,
  onHourChange,
  onMinuteChange,
  disabled,
}) {
  return (
    <div className="hug-attendance-edit-time-row">
      <div className="hug-attendance-edit-time-label">{label}</div>

      <div className="hug-attendance-edit-time-selects">
        <select
          value={hour}
          onChange={(event) => onHourChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">--</option>
          {HOURS.map((value) => (
            <option key={value} value={value}>
              {value.padStart(2, '0')}
            </option>
          ))}
        </select>
        <span>時</span>

        <select
          value={minute}
          onChange={(event) => onMinuteChange(event.target.value)}
          disabled={disabled}
        >
          <option value="">--</option>
          {MINUTES.map((value) => (
            <option key={value} value={value}>
              {value.padStart(2, '0')}
            </option>
          ))}
        </select>
        <span>分</span>
      </div>
    </div>
  )
}

/**
 * 入退室時間編集用のRendererモーダル。
 *
 * データ取得・保存・再取得は親の EditButton が担当し、
 * このコンポーネントは表示と入力だけを担当する。
 */
export default function AttendanceEditModal({
  open,
  name = '',
  editData = null,
  isOpening = false,
  isSaving = false,
  loadError = '',
  startHour = '',
  startMinute = '',
  endHour = '',
  endMinute = '',
  onStartHourChange,
  onStartMinuteChange,
  onEndHourChange,
  onEndMinuteChange,
  onClose,
  onSave,
}) {
  if (!open) return null

  return (
    <ModalPortal>
      <div
        className="hug-attendance-edit-overlay"
        role="presentation"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            onClose?.()
          }
        }}
      >
        <div
          className="hug-attendance-edit-modal"
          role="dialog"
          aria-modal="true"
          aria-label="入退室時間の編集"
        >
          <div className="hug-attendance-edit-header">
            <div>
              <h2>入退室時間の編集</h2>
              <p>{name || editData?.name || '名前未取得'}</p>
            </div>

            <button
              type="button"
              className="hug-attendance-edit-close"
              onClick={onClose}
              disabled={isSaving}
              aria-label="閉じる"
            >
              ×
            </button>
          </div>

          <div className="hug-attendance-edit-body">
            {isOpening ? (
              <div className="py-8 text-center text-sm text-gray-500">
                編集情報を取得中...
              </div>
            ) : loadError ? (
              <div className="rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
                編集情報の取得に失敗しました。
                <div className="mt-1 break-all text-xs">{loadError}</div>
              </div>
            ) : (
              <>
                {editData?.date && (
                  <div className="hug-attendance-edit-date">{editData.date}</div>
                )}

                <TimeSelect
                  label="入室時間"
                  hour={startHour}
                  minute={startMinute}
                  onHourChange={onStartHourChange}
                  onMinuteChange={onStartMinuteChange}
                  disabled={isSaving}
                />

                <TimeSelect
                  label="退室時間"
                  hour={endHour}
                  minute={endMinute}
                  onHourChange={onEndHourChange}
                  onMinuteChange={onEndMinuteChange}
                  disabled={isSaving}
                />
              </>
            )}
          </div>

          <div className="hug-attendance-edit-actions">
            <button
              type="button"
              className="hug-attendance-edit-cancel"
              onClick={onClose}
              disabled={isSaving}
            >
              キャンセル
            </button>

            <button
              type="button"
              className="hug-attendance-edit-save"
              onClick={onSave}
              disabled={isSaving || isOpening || !editData || Boolean(loadError)}
            >
              {isSaving ? '保存中...' : isOpening ? '取得中...' : '保存'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
