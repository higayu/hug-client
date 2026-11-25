import { useSelector } from 'react-redux'
import { selectActiveSpaceId, selectSpace } from '@/store/slices/chilledspaceSlice.js'
import { useAppState } from '@/AppStateContext'
import DynamicOpenBrowserBtn from '@/components/ui/DynamicOpenBrowserBtn'
import { resolveHugPlanUrl } from '../resolveHugPlanUrl.js'

export default function ProfessionalPlanBtn({ className = '', onOpened }) {
  const activeSpaceId = useSelector(selectActiveSpaceId)
  const space = useSelector(selectSpace(activeSpaceId))
  const { appState } = useAppState()
  const childId = space?.childId
  const facilityId = appState.FACILITY_ID

  return (
    <DynamicOpenBrowserBtn
      id="Specialized-Support-Plan"
      role="menuitem"
      label="専門的支援-計画"
      resolveUrl={() => resolveHugPlanUrl({ pageType: 'specialized', childId, facilityId })}
      disabled={!childId}
      resolvingLabel="計画書を検索中…"
      openingLabel="ブラウザ起動中…"
      onOpened={onOpened}
      className={`w-full !justify-start !rounded-none bg-red-600 px-4 text-left text-sm text-white transition-colors hover:bg-red-700 focus:bg-red-700 ${className}`}
    />
  )
}
