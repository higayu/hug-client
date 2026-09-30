import {
  PersonalRecordCheckPanel,
  ProfessionalSupportCheckPanel2,
} from '@/components/common/hug_function'

export default function CheckPanels({
  spaceId,
  selectedChildId,
  selectedChildName,
  facilityId,
  isAbsent,
  hasEntered,
  hasExited,
  isUIEnabled,
  isStop,
  loadingAction,
}) {
  return (
    <div className="mt-2 flex w-full items-center gap-1">
      <PersonalRecordCheckPanel
        selectedChildId={selectedChildId}
        selectedChildName={selectedChildName}
        className="min-w-0 flex-1"
        expandDirection="up"
      />

      <ProfessionalSupportCheckPanel2
        spaceId={spaceId}
        facilityId={facilityId}
        isAbsent={isAbsent}
        hasEntered={hasEntered}
        hasExited={hasExited}
        isUIEnabled={isUIEnabled}
        isStop={isStop}
        loadingAction={loadingAction}
        className="min-w-0 flex-1"
        expandDirection="up"
      />
    </div>
  )
}
