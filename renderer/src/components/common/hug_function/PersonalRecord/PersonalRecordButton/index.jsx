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
  ...buttonProps
}) {
  const { appState } = useAppState();
  const childId = selectedChildId != null
    ? String(selectedChildId)
    : '';

  const handleClick = useCallback(() => {
    if (!childId) {
      console.warn(
        '[PersonalRecordButton] 選択児童IDを取得できません',
        { selectedChildId }
      );
      return;
    }

    console.log(
      '[PersonalRecordButton] 個人記録を開きます',
      {
        childId,
        childName: selectedChildName,
      }
    );

    openPersonalRecordTab({
      appState,
      selectedChildId: childId,
      selectedChildName,
      currentYmd,
    });
  }, [
    appState,
    childId,
    currentYmd,
    selectedChildId,
    selectedChildName,
  ]);

  const isDisabled =
    disabled ||
    !childId;

  return (
    <button
      {...buttonProps}
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={
        childId
          ? `個人記録を開く（児童ID: ${childId}）`
          : '児童を選択してください'
      }
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
