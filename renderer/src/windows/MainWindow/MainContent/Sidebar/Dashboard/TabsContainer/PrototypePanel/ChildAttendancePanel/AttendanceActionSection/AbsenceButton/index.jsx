import { handleAbsenceClick } from "./function/handleAbsenceClick"

export default function AbsenceButton({
  disabled = false,
  loading = false,
  onAbsence,
}) {
  return (
    <button
      type="button"
      className="hug-btn-absence"
      disabled={disabled || loading}
      onClick={() => handleAbsenceClick({ onAbsence })}
      title="欠席モーダルを開く（hugview Cache）"
    >
      {loading ? "処理中…" : "欠席"}
    </button>
  )
}
