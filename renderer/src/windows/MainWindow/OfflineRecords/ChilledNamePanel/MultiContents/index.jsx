import {
  PersonRecordPlanBtn,
  ProfessionalPlanBtn,
  MonitoringButtton,
} from '@/components/common/hug_function/Plan/Open'

import {
  PersonalRecordButton,
} from '@/components/common/hug_function'

const BUTTON_CLASS = `
  !w-8
  !h-8
  !p-0
  !rounded
  !flex
  !items-center
  !justify-center
  text-sm
  font-bold
  shrink-0
`

export default function MultiContents({
  currentYmd,
  selectedChildId='',
  selectedChildName='',
  className = '',
  disabled = false,
  initialContents,
  facilityId,
  staffId,
  onOpened,
  onError,
}) {
  return (
    <div
      className={`
        inline-flex items-center gap-1
        whitespace-nowrap
        ${className}
      `}
    >
      {/* 計画グループ */}
      <div
        className="
          inline-flex items-center gap-1
          rounded-md
          border border-gray-600
          bg-gray-800
          p-1
        "
      >
        <span
          className="
            px-1
            text-xs
            font-medium
            text-gray-200
          "
        >
          計画
        </span>

        {/* 区切り線 */}
        <div className="h-5 w-px bg-gray-500" />

        {/* 個別支援計画 */}
        <PersonRecordPlanBtn
          selectedChildId={selectedChildId}
          label="個"
          title="個別支援計画を開く"
          disabled={disabled}
          className={BUTTON_CLASS}
        />

        {/* 専門的支援計画 */}
        <ProfessionalPlanBtn
          selectedChildId={selectedChildId}
          label="専"
          title="専門的支援計画を開く"
          disabled={disabled}
          className={BUTTON_CLASS}
        />

        {/* モニタリング */}
        <MonitoringButtton
          selectedChildId={selectedChildId}
          selectedChildName={selectedChildName}
          label="モ"
          title="モニタリングを開く"
          disabled={disabled}
          className={`
            ${BUTTON_CLASS}
            bg-blue-600
            text-white
            hover:bg-blue-700
          `}
        />
      </div>

      {/* 個人記録 */}
      <PersonalRecordButton
        initialContents={initialContents}
        facilityId={facilityId}
        staffId={staffId}
        onOpened={onOpened}
        onError={onError}
        label = '個'
        selectedChildId = {selectedChildId}
        selectedChildName = {selectedChildName}
        currentYmd = {currentYmd}
        disabled={disabled}
        className={`
          ${BUTTON_CLASS}
          bg-green-600
          text-white
          hover:bg-green-700
        `}
      />

    </div>
  )
}