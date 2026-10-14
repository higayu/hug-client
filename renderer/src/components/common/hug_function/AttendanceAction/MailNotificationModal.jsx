import { useEffect, useRef } from "react"

import { ModalPortal } from "@/components/modals/ModalPortal.jsx"

/**
 * HUG の #addtend_dialog_mail 相当の通知確認モーダル。
 * resolve(1) = 通知する / resolve(0) = 通知しない、という元拡張の意味を
 * React の onSelect に寄せている。
 */
export default function MailNotificationModal({
  open,
  childName = "",
  actionLabel = "入室",
  onSelect,
  onCancel,
  loading = false,
}) {
  const yesButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault()
        onCancel?.()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    const animationFrameId = window.requestAnimationFrame(() => {
      yesButtonRef.current?.focus()
    })

    return () => {
      window.cancelAnimationFrame(animationFrameId)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open, onCancel, loading])

  if (!open) return null

  const normalizedName = String(childName || "")
    .replace(/\s+/g, " ")
    .trim()

  const subText = normalizedName
    ? `${normalizedName} — ${actionLabel}の記録`
    : "保護者への通知の有無を選んでください"

  return (
    <ModalPortal>
      <div
        className="hug-mail-dialog-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="hug-mail-dialog-title"
        onMouseDown={(event) => {
          if (!loading && event.target === event.currentTarget) {
            onCancel?.()
          }
        }}
      >
        <div className="hug-mail-dialog-box">
          <p
            id="hug-mail-dialog-title"
            className="hug-mail-dialog-title"
          >
            保護者様に通知をしてもよろしいですか？
          </p>

          <p className="hug-mail-dialog-sub">
            {subText}
          </p>

          {loading && (
            <p className="hug-mail-dialog-progress" role="status" aria-live="polite">
              <span className="hug-mail-dialog-spinner" aria-hidden="true" />
              入退室処理・利用者情報の更新中です…
            </p>
          )}

          <div className="hug-mail-dialog-actions">
            <button
              ref={yesButtonRef}
              type="button"
              className="hug-mail-send-yes"
              disabled={loading}
              onClick={() => onSelect?.(1)}
            >
              通知する
            </button>

            <button
              type="button"
              className="hug-mail-send-no"
              disabled={loading}
              onClick={() => onSelect?.(0)}
            >
              通知しない
            </button>

            <button
              type="button"
              className="hug-mail-cancel"
              disabled={loading}
              onClick={() => onCancel?.()}
            >
              キャンセル
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}