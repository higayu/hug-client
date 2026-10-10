import { useTabs } from '@/hooks/useTabs'
import {
  PersonalRecordCheckPanel,
  ProfessionalSupportManagerPanel,
} from '@/components/common/hug_function'

export default function CheckPanels({
  spaceId,
  selectedChildId,
  selectedChildName,
  facilityId,
  currentYmd,
  enterTime,
  leaveTime,
  isAbsent,
  hasEntered,
  hasExited,
  isUIEnabled,
  isStop,
  loadingAction,
}) {
  const { addProfessionalSupportListTab } = useTabs(spaceId)

  return (
    <div className="mt-2 flex w-full items-center gap-1">
      <PersonalRecordCheckPanel
        selectedChildId={selectedChildId}
        selectedChildName={selectedChildName}
        className="min-w-0 flex-1"
        expandDirection="up"
      />

      <ProfessionalSupportManagerPanel
        facilityId={facilityId}
        currentYmd={currentYmd}
        selectedChildId={selectedChildId}
        selectedChildName={selectedChildName}
        enterTime={enterTime}
        leaveTime={leaveTime}
        onOpenProfessionalSupportList={addProfessionalSupportListTab}
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
