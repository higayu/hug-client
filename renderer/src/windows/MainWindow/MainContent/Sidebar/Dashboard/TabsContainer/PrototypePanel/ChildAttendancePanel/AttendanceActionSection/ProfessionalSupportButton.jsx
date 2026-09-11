import { useTabs } from '@/hooks/useTabs'

/**
 * 専門的支援ボタン
 *
 * ボタン自体は常に表示し、以下の条件を満たした場合のみ使用可能。
 *
 * - UI操作可能
 * - 停止中ではない
 * - 他の処理中ではない
 * - 欠席ではない
 * - 入室済み
 * - 退室済み
 */
export default function ProfessionalSupportButton({
  isAbsent,
  hasEntered,
  hasExited,
  isUIEnabled,
  isStop,
  loadingAction,
}) {
  const { addProfessionalSupportNewTab } = useTabs()

  const disabled =
    !isUIEnabled ||
    isStop ||
    Boolean(loadingAction) ||
    isAbsent ||
    !hasEntered ||
    !hasExited

  const getTitle = () => {
    if (isAbsent) {
      return '欠席のため専門的支援は使用できません'
    }

    if (!hasEntered) {
      return '入室後・退室後に使用できます'
    }

    if (!hasExited) {
      return '退室後に使用できます'
    }

    if (!isUIEnabled || isStop) {
      return '現在操作できません'
    }

    if (loadingAction) {
      return '他の処理中のため使用できません'
    }

    return '専門的支援'
  }

  return (
    <button
      type="button"
      className="btn-purple mt-1 w-full p-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      onClick={addProfessionalSupportNewTab}
      disabled={disabled}
      title={getTitle()}
    >
      専門的支援
    </button>
  )
}
