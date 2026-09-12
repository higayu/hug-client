import { useTabs } from '@/hooks/useTabs'
import { handleProfessionalSupportClick } from './function/handleProfessionalSupportClick'

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
    if (isAbsent) return '欠席のため専門的支援は使用できません'
    if (!hasEntered) return '入室後・退室後に使用できます'
    if (!hasExited) return '退室後に使用できます'
    if (!isUIEnabled || isStop) return '現在操作できません'
    if (loadingAction) return '他の処理中のため使用できません'
    return '専門的支援'
  }

  return (
    <button
      type="button"
      className="btn-purple mt-1 w-full p-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() =>
        handleProfessionalSupportClick({
          addProfessionalSupportNewTab,
        })
      }
      disabled={disabled}
      title={getTitle()}
    >
      専門的支援
    </button>
  )
}
