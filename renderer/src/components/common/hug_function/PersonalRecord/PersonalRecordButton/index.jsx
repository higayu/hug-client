import { useCallback } from 'react';

import { useAppState } from '@/AppStateContext';
import { openPersonalRecordTab } from './openPersonalRecordTab';

export default function PersonalRecordButton({
  disabled = false,
  label = '個人記録',
  className = '',
  selectedChildId = '',
  selectedChildName = '',
  currentYmd = '',
}) {
  const { appState } = useAppState();

  const handleClick = useCallback(() => {
    openPersonalRecordTab({
      appState,
      selectedChildId,
      selectedChildName,
      currentYmd,
    });
  }, [appState, currentYmd, selectedChildId, selectedChildName]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title="個人記録を開く"
      className={`
        disabled:grayscale disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
    >
      {label}
    </button>
  );
}
