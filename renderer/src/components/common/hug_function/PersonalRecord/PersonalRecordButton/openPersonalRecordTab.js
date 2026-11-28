import { addPersonalRecordTabAction4 } from '@/components/common/hug_function/PersonalRecord/OpenPersonalRecord';

export function openPersonalRecordTab({
  appState,
  selectedChildId,
  selectedChildName,
  currentYmd,
  initialContents,
  facilityId,
  staffId,
}) {
  const nextAppState = {
    ...appState,
    ...(currentYmd ? { CURRENT_YMD: currentYmd } : {}),
  };

  return addPersonalRecordTabAction4(nextAppState, {
    childId: selectedChildId ? String(selectedChildId) : '',
    childName: selectedChildName || '',
    initialContents,
    facilityId,
    staffId,
    currentYmd,
  });
}
