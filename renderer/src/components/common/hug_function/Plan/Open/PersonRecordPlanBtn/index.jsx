import { useAppState } from '@/AppStateContext'
import DynamicOpenBrowserBtn from '@/components/ui/DynamicOpenBrowserBtn'
import { resolveIndividualPlanUrl } from './resolveIndividualPlanUrl.js'

export default function PersonRecordPlanBtn({
  selectedChildId,
  className = '',
  label = '個別支援-計画',
  title = '個別支援計画を開く',
  disabled = false,
  onOpened,
}) {
  const { appState } = useAppState()

  const childId = selectedChildId
  const facilityId = appState.FACILITY_ID

  return (
    <DynamicOpenBrowserBtn
      id="Individual_Support_Button"
      role="menuitem"
      label={label}
      title={title}
      resolveUrl={() =>
        resolveIndividualPlanUrl({
          childId,
          facilityId,
        })
      }
      disabled={disabled || !childId || !facilityId}
      resolvingLabel="検索中…"
      openingLabel="起動中…"
      onOpened={onOpened}
      className={`
        w-full
        bg-green-600
        px-4
        text-sm
        text-white
        transition-colors
        hover:bg-green-700
        focus:bg-green-700
        ${className}
      `}
    />
  )
}