import { useCallback } from 'react';
import { useSelector } from 'react-redux';

import { useAppState } from '@/AppStateContext';
import {
  selectActiveSpaceId,
  selectSpace,
} from '@/store/slices/chilledspaceSlice.js';

import { addPersonalRecordTabAction4 } from '@/hooks/useTabs/actions/personalRecord';

export default function PersonalRecordButton({
  spaceId,
  disabled = false,
  label = '個人記録',
  className = '',
}) {
  const {
    appState,
  } = useAppState();

  // spaceId が明示されていればその枠を使用。
  // 未指定の場合は現在アクティブな枠を使用する。
  const activeSpaceId =
    useSelector(selectActiveSpaceId);

  const effectiveSpaceId =
    spaceId || activeSpaceId;

  const space =
    useSelector(
      selectSpace(effectiveSpaceId)
    );

  const childId =
    space?.childId ?? '';

  const handleClick = useCallback(() => {
    if (!effectiveSpaceId) {
      console.error(
        '[PersonalRecordButton] spaceId を取得できません'
      );
      return;
    }

    if (!space?.childId) {
      console.warn(
        '[PersonalRecordButton] 選択児童IDを取得できません',
        {
          effectiveSpaceId,
          space,
        }
      );
      return;
    }

    console.log(
      '[PersonalRecordButton] 個人記録を開きます',
      {
        spaceId: effectiveSpaceId,
        childId: space.childId,
        childName: space.childName,
      }
    );

    addPersonalRecordTabAction4(
      appState,
      space
    );
  }, [
    appState,
    effectiveSpaceId,
    space,
  ]);

  const isDisabled =
    disabled ||
    !effectiveSpaceId ||
    !childId;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={
        childId
          ? `個人記録を開く（児童ID: ${childId}）`
          : '児童を選択してください'
      }
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
