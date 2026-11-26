
import {
  ExpandableLabelPanel,
  ExpandableManagerPanel,
} from '@/components/ui/ManagerPanel'

import MultiContents from './MultiContents';


export default function ChilledNamePanel({
  selectedChildId,
  selectedChildName,
  currentYmd,
  labelName='',
  className='',
  panelClassName='',
}) {
  return (
    <ExpandableLabelPanel
      label={labelName}
      expandDirection="up"
      buttonClassName={className}
      panelClassName={panelClassName}
    >
      <MultiContents  
        selectedChildId={selectedChildId}
        selectedChildName={selectedChildName}
        currentYmd={currentYmd}
      />
    </ExpandableLabelPanel>
  );
}