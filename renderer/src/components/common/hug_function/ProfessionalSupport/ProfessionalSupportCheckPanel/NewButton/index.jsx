import { useAppState } from '@/AppStateContext';
import { openProfessionalSupportNewTab } from './openProfessionalSupportNewTab';

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
export default function NewButton({
  className = "",
  selectedChildId = "",
  selectedChildName = "",
  currentYmd = "",
  enterTime = "",
  leaveTime = "",
  isAbsent,
  hasEntered,
  hasExited,
  isUIEnabled,
  isStop,
  loadingAction,
}) {
  const { appState } = useAppState();

  const disabled =
    !selectedChildId ||
    !currentYmd ||
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

    if (!selectedChildId) {
      return '児童IDが取得できません'
    }

    if (!currentYmd) {
      return '対象日付が取得できません'
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

    return '専門的支援を作成します'
  }

  const handleClick = () => {
    openProfessionalSupportNewTab({
      appState,
      selectedChildId,
      selectedChildName,
      currentYmd,
      enterTime,
      leaveTime,
    });
  }

  return (
    <button
      type="button"
      className={`btn-purple rounded px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-50 ${className}`.trim()}
      onClick={handleClick}
      disabled={disabled}
      title={getTitle()}
    >
      新規
    </button>
  )
}
