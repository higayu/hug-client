import { handleAbsenceClick } from './function/handleAbsenceClick'

export default function AbsenceButton({
  disabled = false,
  loading = false,
  onAbsence,
}) {
  const onClick = () => handleAbsenceClick({ onAbsence })

  return (
    <button
      type="button"
      className="hug-btn-absence"
      disabled={disabled || loading}
      onClick={onClick}
      title="欠席モーダルを開く（hugview Cache）"
    >
      {loading ? '処理中…' : '欠席'}
    </button>
  )
}
