import { useAppState } from '@/AppStateContext'

/** 画面側で専門的支援パネルに渡すデータを解決する。 */
export function useProfessionalSupportPanelData(selectedChildId) {
  const {
    appState,
    iniState,
    databaseState,
    childrenData,
    waiting_childrenData,
    Experience_childrenData,
  } = useAppState()
  const childId = selectedChildId == null ? '' : String(selectedChildId)
  // ChildNotesTabs と同じ優先順位。DB の空文字も最新値として扱う。
  const sources = [
    databaseState?.children,
    childrenData,
    waiting_childrenData,
    Experience_childrenData,
  ]
  const child = sources
    .filter(Array.isArray)
    .map((items) => items.find((item) =>
      childId && String(item?.id ?? item?.children_id) === childId,
    ))
    .find(Boolean)

  return {
    professionalPlanNotes: typeof child?.notes2 === 'string' ? child.notes2 : '',
    staffId: appState?.STAFF_ID,
    saveMode: iniState?.apiSettings?.professionalSupportSaveMode === 'created'
      ? 'created'
      : 'draft',
  }
}
