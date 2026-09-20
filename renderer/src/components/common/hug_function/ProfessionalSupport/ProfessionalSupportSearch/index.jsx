import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import { selectFacilitys } from '@/store/slices/databaseSlice'

/**
 * HUGの専門的支援検索ウィンドウを開くボタン。
 * CustomButtons には依存せず、このコンポーネント内で必要な値を取得する。
 */
export default function ProfessionalSupportSearch({
  className = '',
  label = '専門的支援検索',
  disabled = false,
}) {
  const { appState } = useAppState()
  const facilitys = useSelector(selectFacilitys)

  const facilityId = appState?.FACILITY_ID
  const targetDate = appState?.CURRENT_YMD

  const handleClick = useCallback(() => {
    if (disabled) {
      return
    }

    if (!facilityId) {
      console.warn(
        '[ProfessionalSupportSearch] FACILITY_ID を取得できません',
      )
      return
    }

    if (!targetDate) {
      console.warn(
        '[ProfessionalSupportSearch] CURRENT_YMD を取得できません',
      )
      return
    }

    const numericFacilityId = Number(facilityId)
    const targetFacility = facilitys.find(
      (facility) => Number(facility?.id) === numericFacilityId,
    )

    if (!targetFacility) {
      console.warn(
        '[ProfessionalSupportSearch] 対象施設を取得できません',
        {
          facilityId,
          facilitys,
        },
      )
      return
    }

    if (!window.electronAPI?.handleProfessionalSupportSearch) {
      console.error(
        '[ProfessionalSupportSearch] electronAPI.handleProfessionalSupportSearch が見つかりません',
      )
      return
    }

    console.log(
      '[ProfessionalSupportSearch] 専門的支援検索を開きます',
      {
        facilityId,
        targetFacility,
        targetDate,
      },
    )

    window.electronAPI.handleProfessionalSupportSearch(
      facilityId,
      targetFacility,
      targetDate,
    )
  }, [
    disabled,
    facilityId,
    facilitys,
    targetDate,
  ])

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
          : '専門的支援検索を開く'
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
