import { useState } from 'react'
import { useTabs } from '@/hooks/useTabs'
import { handleProfessionalSupportClick } from './function/handleProfessionalSupportClick'

/**
 * 専門的支援ボタン
 */
export default function ProfessionalSupportButton({
  isAbsent,
  hasEntered,
  hasExited,
  isUIEnabled,
  isStop,
  loadingAction,
  spaceId,
}) {
  const { addProfessionalSupportNewTab } = useTabs(spaceId)
  const [message, setMessage] = useState('')

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

  const onClick = async () => {
    setMessage('')

    const result = await handleProfessionalSupportClick({
      addProfessionalSupportNewTab,
    })

    console.log('[ProfessionalSupportButton] result:', result)

    if (!result?.ok) {
      setMessage(`エラー: ${result?.error || '処理に失敗しました'}`)
      return
    }

    // useTabs側が保存結果を返す実装になった場合、その結果もここで受け取れる。
    if (result?.saved === true) {
      setMessage('下書き保存OK')
    } else if (result?.saved === false) {
      setMessage(`下書き保存NG: ${result?.error || '保存を確認できませんでした'}`)
    }
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        className="btn-purple w-full p-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
        onClick={onClick}
        disabled={disabled}
        title={getTitle()}
      >
        専門的支援
      </button>

      {message ? (
        <p className="mt-1 break-all text-xs">{message}</p>
      ) : null}
    </div>
  )
}
