import React from 'react'
import { toast } from 'sonner'
import { COLORS } from './app/constants.js'

const LABELS = { success: '完了', error: 'エラー', warning: '確認', info: 'お知らせ' }
const BACKGROUNDS = { success: COLORS.SUCCESS, error: COLORS.DANGER, warning: COLORS.WARNING, info: COLORS.PRIMARY }

// Accept both the existing positional API and the new object API.
export function showToast(messageOrOptions, type = 'info', duration = 3000, options = {}) {
  const config = messageOrOptions && typeof messageOrOptions === 'object' && !React.isValidElement(messageOrOptions)
    ? messageOrOptions
    : { ...options, message: messageOrOptions, type, duration }
  const { message, title, details, onClose } = config
  const method = Object.hasOwn(LABELS, config.type) ? config.type : 'info'
  const detailText = Array.isArray(details) ? details.filter(Boolean).join('\n') : details
  if (!message && !title && !detailText) return null
  let closed = false
  const handleClose = () => {
    if (closed) return
    closed = true
    // Match the old callback signature and 300ms exit delay.
    if (onClose) setTimeout(() => onClose(), 300)
  }
  return toast[method](title || LABELS[method], {
    duration: config.duration ?? 3000,
    description: <>
      {message && <div className="hug-toast-message">{message}</div>}
      {detailText && <div className="hug-toast-details">{detailText}</div>}
    </>,
    style: { background: BACKGROUNDS[method], color: method === 'warning' ? '#000' : '#fff', borderColor: BACKGROUNDS[method] },
    onDismiss: handleClose,
    onAutoClose: handleClose,
  })
}

export const showSuccessToast = (message, duration = 3000) => showToast(message, 'success', duration)
export const showErrorToast = (message, duration = 4000) => showToast(message, 'error', duration)
export const showWarningToast = (message, duration = 3500) => showToast(message, 'warning', duration)
export const showInfoToast = (message, duration = 3000) => showToast(message, 'info', duration)
export function showResultToast({ title = '処理結果', message, details, success = true, duration = 5000 }) {
  return showToast({ title, message, details, type: success ? 'success' : 'error', duration })
}
export const dismissToast = (id) => toast.dismiss(id)
export const clearAllToasts = () => toast.dismiss()

export const notifications = { showToast, showSuccessToast, showErrorToast, showWarningToast, showInfoToast, showResultToast, clearAllToasts }
// Compatibility for existing consumers; no Context or Provider is required.
export const useToast = () => notifications
