import { useState } from 'react';
import { useSelector } from 'react-redux';
import {
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

import {
  useToast,
} from '@/provider/ToastProvider/ToastContext.jsx';

import {
  selectFacilityId,
} from '@/store/slices/appStateSlice';


import { executeFlowV2 } from '@/components/WebAutomationV2';

export default function StaffUpdateButton({
  facilityId: facilityIdProp,
  disabled = false,
  className = '',
  webview = null,
}) {
  const [isLoading, setIsLoading] =
    useState(false);

  const [label, setLabel] =
    useState('職員更新');

  const {
    showInfoToast,
    showResultToast,
  } = useToast();

  const storeFacilityId = useSelector(
    selectFacilityId,
  );

  const facilityId =
    facilityIdProp ?? storeFacilityId;

  const isDisabled =
    disabled ||
    isLoading ||
    !facilityId;

  const handleClick = async () => {
    if (isDisabled) {
      return;
    }


    setIsLoading(true);
    setLabel('職員取得中...');

    showInfoToast(
      'HUGから職員データを取得しています',
      2000,
    );

    try {
      const result = await executeFlowV2(
        'staff_fetch',
        {
          facilityId,
        },
      );

      console.groupCollapsed(
        `[HUG職員同期] HUG取得データ (${result.fetched_count}件)`,
      );
      console.log('取得データ:', result);
      console.log(
        '取得データ JSON:',
        JSON.stringify(result, null, 2),
      );
      console.table(result.staff ?? []);
      console.groupEnd();


      if (
        !window.electronAPI
          ?.syncHugStaffs
      ) {
        throw new Error(
          '職員同期APIを利用できません。アプリを再起動してください。',
        );
      }

      setLabel('DB更新中...');

      console.groupCollapsed(
        `[HUG職員同期] Laravel送信データ (${result.fetched_count}件)`,
      );
      console.log('送信先API:', 'syncHugStaffs');
      console.log('送信データ:', result);
      console.log(
        '送信データ JSON:',
        JSON.stringify(result, null, 2),
      );
      console.table(result.staff ?? []);
      console.groupEnd();

      const syncResult =
        await window.electronAPI
          .syncHugStaffs(result);

      const responseSummary =
        syncResult == null
          ? ''
          : typeof syncResult ===
              'string'
            ? syncResult
            : JSON.stringify(
                syncResult,
                null,
                2,
              );

      showResultToast({
        title: 'HUG職員同期 完了',
        message:
          `${result.fetched_count}件の職員データを同期しました`,
        details: [
          result.total_count != null
            ? `HUG登録件数: ${result.total_count}件`
            : '',
          `取得件数: ${result.fetched_count}件`,
          responseSummary
            ? `DB応答:\n${responseSummary}`
            : '',
        ].filter(Boolean),
        duration: 7000,
      });
    } catch (error) {
      console.error(
        '[HUG WM] 職員同期エラー:',
        error,
      );

      showResultToast({
        title: 'HUG職員同期 エラー',
        message:
          '職員データを同期できませんでした',
        details:
          error?.message ||
          String(error),
        success: false,
        duration: 7000,
      });
    } finally {
      setIsLoading(false);
      setLabel('職員更新');
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        flex
        items-center
        justify-center
        gap-2
        bg-sky-600
        px-4
        py-2
        text-center
        text-sm
        text-white
        transition-colors
        hover:bg-blue-700
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
      title="HUGの職員データを取得してDBへ同期"
    >
      <ArrowPathIcon
        className={`
          h-5
          w-5
          ${
            isLoading
              ? 'animate-spin'
              : ''
          }
        `}
      />

      <span>{label}</span>
    </button>
  );
}
