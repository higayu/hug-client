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

import {
  confirmDialog,
} from '@/utils/dialog/confirmDialog.js';

import {
  getActiveWebview,
} from '@/utils/webview/webviewState.js';

import {
  fetchStaffData,
} from './fetchStaffData.js';

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

  /**
   * 実行時点のWebViewを取得する。
   *
   * webviewには以下のどちらが渡されても対応する。
   * ・WebView要素
   * ・WebViewを返す関数
   */
  const resolveWebview = () => {
    const targetWebview =
      typeof webview === 'function'
        ? webview()
        : webview;

    return (
      targetWebview ??
      getActiveWebview()
    );
  };

  const handleClick = async () => {
    if (isDisabled) {
      return;
    }

    const shouldFetch =
      await confirmDialog(
        '本当に実行しますか？',
      );

    if (!shouldFetch) {
      return;
    }

    setIsLoading(true);
    setLabel('職員取得中...');

    showInfoToast(
      'HUGから職員データを取得しています',
      2000,
    );

    try {
      const activeWebview =
        resolveWebview();

      if (!activeWebview) {
        throw new Error(
          'HUGのWebViewが見つかりません。HUGの画面を開いてから、もう一度実行してください。',
        );
      }

      if (
        typeof activeWebview.executeJavaScript !==
        'function'
      ) {
        throw new Error(
          '有効なHUGのWebViewを取得できませんでした。HUGの画面を開き直してから、もう一度実行してください。',
        );
      }

      const result = await fetchStaffData(
        (page, maxPage) => {
          setLabel(
            `職員取得 ${page}/${maxPage}`,
          );
        },
        facilityId,
        activeWebview,
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

      const shouldSync =
        await confirmDialog(
          `HUG職員データ ${result.fetched_count}件をDBへ保存・更新します。実行しますか？`,
        );

      if (!shouldSync) {
        return;
      }

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
