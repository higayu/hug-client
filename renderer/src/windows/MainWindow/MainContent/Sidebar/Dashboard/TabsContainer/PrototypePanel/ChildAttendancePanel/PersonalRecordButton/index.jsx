import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import {
  selectSpace,
} from '@/store/slices/chilledspaceSlice.js'

import {
  addPersonalRecordTabAction4,
} from '@/hooks/useTabs/actions/personalRecord'

export default function PersonalRecordButton({
  spaceId = 'top',
  disabled = false,
  label = '個人記録',
  className = '',
}) {
  const {
    appState,
  } = useAppState()

  const space = useSelector(
    selectSpace(spaceId)
  )

  const childId =
    space?.childId ?? ''

  const handleClick = useCallback(() => {
    if (!space?.childId) {
      console.warn(
        '[Prototype/PersonalRecordButton] 選択児童IDを取得できません',
        {
          spaceId,
          space,
        }
      )
      return
    }

    console.log(
      '[Prototype/PersonalRecordButton] 個人記録を開きます',
      {
        spaceId,
        childId: space.childId,
        childName: space.childName,
      }
    )

    addPersonalRecordTabAction4(
      appState,
      space
    )
  }, [
    appState,
    space,
    spaceId,
  ])

  const isDisabled =
    disabled ||
    !childId

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={
        childId
          ? `個人記録を開く（児童ID: ${childId}）`
          : '児童を選択してください'
      }
      className={`
        w-full
        rounded
        bg-[#00a405]
        px-3
        py-2
        text-sm
        font-semibold
        text-white
        cursor-pointer
        whitespace-nowrap
        transition-all
        hover:bg-[#006305]
        hover:scale-[1.01]
        active:bg-[#005004]
        active:scale-[0.99]
        disabled:grayscale
        disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
    >
      {label}
    </button>
  )
}
