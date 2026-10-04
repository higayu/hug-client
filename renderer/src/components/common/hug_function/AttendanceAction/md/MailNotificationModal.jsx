import { useEffect, useRef } from "react"

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
}) {
  const yesButtonRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault()
        onCancel?.()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    window.requestAnimationFrame(() => yesButtonRef.current?.focus())

    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, onCancel])

  if (!open) return null

  const normalizedName = String(childName || "").replace(/\s+/g, " ").trim()
  const subText = normalizedName
    ? `${normalizedName} — ${actionLabel}の記録`
    : "保護者への通知の有無を選んでください"

  return (
    <div
      className="hug-mail-dialog-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="hug-mail-dialog-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel?.()
      }}
    >
      <div className="hug-mail-dialog-box">
        <p id="hug-mail-dialog-title" className="hug-mail-dialog-title">
          保護者様に通知をしてもよろしいですか？
        </p>

        <p className="hug-mail-dialog-sub">{subText}</p>

        <div className="hug-mail-dialog-actions">
          <button
            ref={yesButtonRef}
            type="button"
            className="hug-mail-send-yes"
            onClick={() => onSelect?.(1)}
          >
            通知する
          </button>

          <button
            type="button"
            className="hug-mail-send-no"
            onClick={() => onSelect?.(0)}
          >
            通知しない
          </button>

          <button
            type="button"
            className="hug-mail-cancel"
            onClick={() => onCancel?.()}
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
