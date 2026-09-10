/**
 * 拡張 form-render の hug-btn-post-enter / hug-btn-post-leave 相当
 */

function MailIcon() {
  return (
    <span
      className="hug-btn-mail-icon"
      aria-hidden="true"
      title="メール確認あり"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" focusable="false">
        <path
          fill="currentColor"
          d="M1 3.5A1.5 1.5 0 0 1 2.5 2h11A1.5 1.5 0 0 1 15 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 1 12.5v-9zm1.5-.5a.5.5 0 0 0-.5.5v.217l5.834 4.375a.5.5 0 0 0 .616 0L14 3.717V3.5a.5.5 0 0 0-.5-.5h-11zm12.29 1.625L8.5 8.876 1.71 4.625A.5.5 0 0 0 1 5v7.5a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5V5a.5.5 0 0 0-.21-.392z"
        />
      </svg>
    </span>
  );
}

/**
 * @param {{
 *   action: 'enter' | 'leave',
 *   hasMail?: boolean,
 *   disabled?: boolean,
 *   loading?: boolean,
 *   title?: string,
 *   onClick?: () => void,
 * }} props
 */
export default function AttendancePostButton({
  action,
  hasMail = false,
  disabled = false,
  loading = false,
  title = "",
  onClick,
}) {
  const label = action === "enter" ? "入室" : "退室";
  const className = [
    action === "enter" ? "hug-btn-post-enter" : "hug-btn-post-leave",
    hasMail ? "hug-btn-has-mail" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const ariaLabel = hasMail ? `メール確認あり、${label}` : label;

  return (
    <button
      type="button"
      className={className}
      disabled={disabled || loading}
      title={title}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {hasMail ? (
        <span className="hug-btn-label-with-mail">
          <MailIcon />
          <span className="hug-btn-label-text">
            {loading ? "処理中…" : label}
          </span>
        </span>
      ) : (
        loading ? "処理中…" : label
      )}
    </button>
  );
}
