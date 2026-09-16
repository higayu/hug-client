import { addPersonalRecordTabAction4 } from '@/hooks/useTabs/actions/personalRecord';

export function openPersonalRecordTab({
  appState,
  selectedChildId,
  selectedChildName,
  currentYmd,
}) {
  const nextAppState = {
    ...appState,
    ...(currentYmd ? { CURRENT_YMD: currentYmd } : {}),
  };

  addPersonalRecordTabAction4(nextAppState, {
    childId: selectedChildId ? String(selectedChildId) : '',
    childName: selectedChildName || '',
  });
}
