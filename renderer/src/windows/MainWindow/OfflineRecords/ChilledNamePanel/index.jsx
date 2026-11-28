
import {
  ExpandableLabelPanel,
} from '@/components/ui/ManagerPanel'

import MultiContents from './MultiContents';


export default function ChilledNamePanel({
  selectedChildId,
  selectedChildName,
  currentYmd,
  labelName='',
  className='',
  panelClassName='',
  initialContents,
  facilityId,
  staffId,
  onOpened,
  onError,
  disabled = false,
}) {
  return (
    <ExpandableLabelPanel
      label={labelName}
      disabled={disabled}
      expandDirection="up"
      buttonClassName={className}
      panelClassName={panelClassName}
    >
      <MultiContents  
        selectedChildId={selectedChildId}
        selectedChildName={selectedChildName}
        currentYmd={currentYmd}
        initialContents={initialContents}
        facilityId={facilityId}
        staffId={staffId}
        onOpened={onOpened}
        onError={onError}
        disabled={disabled}
      />
    </ExpandableLabelPanel>
  );
}