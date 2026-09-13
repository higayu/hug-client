import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export default function ProfessionalSupportPostModal({
  open,
  submitting = false,
  childName = '',
  childId = '',
  facilityId = '',
  initialDate = '',
  initialStartTime = '',
  initialEndTime = '',
  errorMessage = '',
  onCancel,
  onSubmit,
}) {
  const [date, setDate] = useState(initialDate)
  const [startTime, setStartTime] = useState(initialStartTime)
  const [endTime, setEndTime] = useState(initialEndTime)
  const [title, setTitle] = useState('記録')
  const [contents, setContents] = useState('')

  useEffect(() => {
    if (!open) return
    setDate(initialDate || '')
    setStartTime(initialStartTime || '')
    setEndTime(initialEndTime || '')
    setTitle('記録')
    setContents('')
  }, [open, initialDate, initialStartTime, initialEndTime, childId])

  useEffect(() => {
    if (!open) return undefined

    const onKeyDown = (event) => {
      if (event.key === 'Escape' && !submitting) onCancel?.()
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, submitting, onCancel])

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    if (submitting) return

    onSubmit?.({
      dateStr: date,
      startTime,
      endTime,
      title,
      contents,
    })
  }

  return createPortal(
    <div className="fixed inset-0 z-[20000] flex items-center justify-center bg-black/60 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg rounded-lg border border-gray-700 bg-gray-900 p-4 text-white shadow-2xl"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">専門的支援 下書き登録</h2>
            <p className="mt-0.5 text-xs text-gray-400">
              HUGの編集画面は開かず、入力内容を直接POSTします。
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded px-2 py-1 text-gray-300 hover:bg-gray-800 disabled:opacity-50"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <div className="mb-3 grid grid-cols-2 gap-2 rounded bg-gray-800 p-2 text-xs">
          <div>
            <span className="text-gray-400">児童</span>
            <div className="font-semibold">{childName || childId || '-'}</div>
          </div>
          <div>
            <span className="text-gray-400">施設ID</span>
            <div className="font-semibold">{facilityId || '-'}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="text-xs text-gray-300 sm:col-span-1">
            実施日
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              readOnly
              className="mt-1 w-full cursor-default rounded border border-gray-600 bg-gray-800 px-2 py-2 text-sm text-gray-200"
            />
          </label>

          <label className="text-xs text-gray-300">
            開始時刻
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-2 text-sm text-white"
            />
          </label>

          <label className="text-xs text-gray-300">
            終了時刻
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-2 text-sm text-white"
            />
          </label>
        </div>

        <label className="mt-3 block text-xs text-gray-300">
          項目名
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded border border-gray-600 bg-gray-800 px-2 py-2 text-sm text-white"
          />
        </label>

        <label className="mt-3 block text-xs text-gray-300">
          記録内容
          <textarea
            value={contents}
            onChange={(e) => setContents(e.target.value)}
            required
            rows={9}
            autoFocus
            placeholder="専門的支援の実施内容を入力してください"
            className="mt-1 w-full resize-y rounded border border-gray-600 bg-gray-800 px-3 py-2 text-sm leading-relaxed text-white outline-none focus:border-purple-500"
          />
        </label>

        {errorMessage ? (
          <div className="mt-3 rounded border border-red-700 bg-red-950/60 px-3 py-2 text-xs text-red-200">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded bg-gray-700 px-4 py-2 text-sm font-semibold hover:bg-gray-600 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting || !date || !contents.trim()}
            className="rounded bg-purple-600 px-4 py-2 text-sm font-semibold hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? '送信中...' : '下書き保存して専門＋を登録'}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  )
}
