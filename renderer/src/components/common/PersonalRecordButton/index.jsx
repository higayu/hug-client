import { useCallback } from 'react';

import { useAppState } from '@/AppStateContext';
import { addPersonalRecordTabAction4 } from '@/hooks/useTabs/actions/personalRecord';

export default function PersonalRecordButton({
  disabled = false,
  label='個人記録',
  className='',
}) {
  const { appState } = useAppState();

  const handleClick = useCallback(() => {
    addPersonalRecordTabAction4(appState);
  }, [appState]);

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      title='個人記録を開く'
      className={`
        bg-[#00a405] text-white
        cursor-pointer transition-all whitespace-nowrap
        hover:bg-[#006305] hover:scale-105
        active:bg-[#005004] active:scale-[0.97]
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