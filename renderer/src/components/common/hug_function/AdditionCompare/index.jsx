import { useCallback } from 'react'

import { useAppState } from '@/AppStateContext'

/**
 * HUGの加算比較ウィンドウを開くボタン。
 * CustomButtons には依存せず、このコンポーネント内で必要な値を取得する。
 */
export default function AdditionCompare({
  className = '',
  label = '加算比較',
  disabled = false,
}) {
  const { appState } = useAppState()

  const facilityId = appState?.FACILITY_ID
  const targetDate = appState?.CURRENT_YMD

  const handleClick = useCallback(() => {
    if (disabled) {
      return
    }

    if (!facilityId) {
      console.warn(
        '[AdditionCompare] FACILITY_ID を取得できません',
      )
      return
    }

    if (!targetDate) {
      console.warn(
        '[AdditionCompare] CURRENT_YMD を取得できません',
      )
      return
    }

    if (!window.electronAPI?.open_addition_compare_btn) {
      console.error(
        '[AdditionCompare] electronAPI.open_addition_compare_btn が見つかりません',
      )
      return
    }

    console.log(
      '[AdditionCompare] 加算比較を開きます',
      {
        facilityId,
        targetDate,
      },
    )

    window.electronAPI.open_addition_compare_btn(
      facilityId,
      targetDate,
    )
  }, [disabled, facilityId, targetDate])

  const isDisabled = disabled || !facilityId || !targetDate

  return (
    <button
      type="button"
      role="menuitem"
      onClick={handleClick}
      disabled={isDisabled}
      title={
        isDisabled
          ? '施設と日付を選択してください'
          : '加算比較を開く'
      }
      className={`
        flex
        w-full
        cursor-pointer
        items-center
        border-none
        bg-transparent
        px-4
        py-2
        text-left
        text-sm
        text-black
        transition-colors
        hover:bg-[#e3f2fd]
        focus:bg-[#e3f2fd]
        focus:outline-none
        disabled:cursor-not-allowed
        disabled:opacity-50
        ${className}
      `}
    >
      <span>{label}</span>
    </button>
  )
}
