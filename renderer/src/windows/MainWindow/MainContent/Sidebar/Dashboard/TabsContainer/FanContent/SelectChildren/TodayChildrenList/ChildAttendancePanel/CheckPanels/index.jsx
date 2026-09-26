import { PersonalRecordCheckPanel } from '@/components/common/hug_function/PersonalRecord'
import { ProfessionalSupportCheckPanel2 } from '@/components/common/hug_function/ProfessionalSupport'

export default function CheckPanels({
  spaceId,
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
        spaceId={spaceId}
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
