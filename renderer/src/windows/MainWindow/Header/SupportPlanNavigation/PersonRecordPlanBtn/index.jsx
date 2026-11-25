import { useSelector } from 'react-redux'
import { selectActiveSpaceId, selectSpace } from '@/store/slices/chilledspaceSlice.js'
import { useAppState } from '@/AppStateContext'
import DynamicOpenBrowserBtn from '@/components/ui/DynamicOpenBrowserBtn'
import { resolveHugPlanUrl } from '../resolveHugPlanUrl.js'

export default function PersonRecordPlanBtn({ className = '', onOpened }) {
  const activeSpaceId = useSelector(selectActiveSpaceId)
  const space = useSelector(selectSpace(activeSpaceId))
  const { appState } = useAppState()
  const childId = space?.childId
  const facilityId = appState.FACILITY_ID

  return (
    <DynamicOpenBrowserBtn
      id="Individual_Support_Button"
      role="menuitem"
      label="個別支援-計画"
      resolveUrl={() => resolveHugPlanUrl({ pageType: 'individual', childId, facilityId })}
      disabled={!childId || !facilityId}
      resolvingLabel="計画書を検索中…"
      openingLabel="ブラウザ起動中…"
      onOpened={onOpened}
      className={`w-full !justify-start !rounded-none bg-green-600 px-4 text-left text-sm text-white transition-colors hover:bg-green-700 focus:bg-green-700 ${className}`}
    />
  )
}
