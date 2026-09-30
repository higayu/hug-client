import { addProfessionalSupportNewAction3 } from '@/hooks/useTabs/actions/professionalNew.js';

export function openProfessionalSupportNewTab({
  appState,
  selectedChildId,
  selectedChildName,
  currentYmd,
  enterTime,
  leaveTime,
}) {
  addProfessionalSupportNewAction3(appState, {
    selectedChildId,
    selectedChildName,
    currentYmd,
    enterTime,
    leaveTime,
  });
}
