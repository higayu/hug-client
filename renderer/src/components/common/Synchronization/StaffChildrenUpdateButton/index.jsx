import { useState } from 'react';
import { useSelector } from 'react-redux';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

import { useToast } from '@/provider/ToastProvider/ToastContext.jsx';
import { useAppState } from '@/AppStateContext';
import { selectFacilityId } from '@/store/slices/appStateSlice';
import { getActiveWebview } from '@/utils/webview/webviewState.js';

import { fetchStaffData } from '../StaffUpdateButton/fetchStaffData.js';
import { fetchChildrenData } from '../ChildrenUpdateButton/fetchChildrenData.js';

export default function StaffChildrenUpdateButton({
  facilityId: facilityIdProp,
  disabled = false,
  className = '',
  webview = null,
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [label, setLabel] = useState('職員・児童更新');

  const { showInfoToast, showResultToast } = useToast();
  const { CURRENT_DAY_OF_WEEK } = useAppState();

  const storeFacilityId = useSelector(selectFacilityId);
  const facilityId = facilityIdProp ?? storeFacilityId;

  const isDisabled = disabled || isLoading || !facilityId;

  /**
   * 実行時点のHUG WebViewを取得する。
   * webviewにはWebView要素、またはWebViewを返す関数を渡せる。
   */
  const resolveWebview = () => {
    const targetWebview =
      typeof webview === 'function'
        ? webview()
        : webview;

    return targetWebview ?? getActiveWebview();
  };

  const syncStaffs = async (activeWebview) => {
    setLabel('職員取得中...');

    const result = await fetchStaffData(
      (page, maxPage) => {
        setLabel(`職員取得 ${page}/${maxPage}`);
      },
      facilityId,
      activeWebview,
    );

    console.groupCollapsed(
      `[HUG一括同期] 職員取得データ (${result.fetched_count}件)`,
    );
    console.log('取得データ:', result);
    console.log(
      '取得データ JSON:',
      JSON.stringify(result, null, 2),
    );
    console.table(result.staff ?? []);
    console.groupEnd();

    if (!window.electronAPI?.syncHugStaffs) {
      throw new Error(
        '職員同期APIを利用できません。アプリを再起動してください。',
      );
    }

    setLabel('職員DB更新中...');

    console.groupCollapsed(
      `[HUG一括同期] Laravel職員送信データ (${result.fetched_count}件)`,
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
      await window.electronAPI.syncHugStaffs(result);

    console.log(
      '[HUG一括同期] 職員DB同期結果:',
      syncResult,
    );

    return {
      fetchedCount: result.fetched_count ?? 0,
      totalCount: result.total_count ?? null,
      syncResult,
    };
  };

  const syncChildren = async (activeWebview) => {
    setLabel('児童取得中...');

    const result = await fetchChildrenData(
      (page, maxPage) => {
        setLabel(`児童取得 ${page}/${maxPage}`);
      },
      facilityId,
      CURRENT_DAY_OF_WEEK,
      activeWebview,
    );

    console.groupCollapsed(
      `[HUG一括同期] 児童取得データ (${result.children?.length ?? 0}件)`,
    );
    console.log('取得データ:', result);
    console.log(
      '取得データ JSON:',
      JSON.stringify(result, null, 2),
    );
    console.table(result.children ?? []);
    console.groupEnd();

    if (!window.electronAPI?.syncHugChildrens) {
      throw new Error(
        '児童同期APIを利用できません。アプリを再起動してください。',
      );
    }

    setLabel('児童DB更新中...');

    const facilityIdNum = Number(facilityId) || 3;

    const childrenJson = (result.children ?? []).map(
      (child) => ({
        id: Number(child.id),
        name: child.name || '',
        furigana: child.furigana || '',
        pronunciation_id: child.pronunciation_id
          ? Number(child.pronunciation_id)
          : null,
        children_type_id: child.children_type_id || 1,
        notes: child.notes || '',
        notes2: child.notes2 || '',
        personal_tmp: child.personal_tmp || '',
        is_delete: child.is_delete || 0,
        leaving_at: child.leaving_at || null,
      }),
    );

    const payload = {
      facility_id: facilityIdNum,
      children: childrenJson,
    };

    console.groupCollapsed(
      `[HUG一括同期] Laravel児童送信データ (${childrenJson.length}件)`,
    );
    console.log('送信先API:', 'syncHugChildrens');
    console.log('送信データ:', payload);
    console.log(
      '送信データ JSON:',
      JSON.stringify(payload, null, 2),
    );
    console.table(childrenJson);
    console.groupEnd();

    const syncResult =
      await window.electronAPI.syncHugChildrens(payload);

    console.log(
      '[HUG一括同期] 児童DB同期結果:',
      syncResult,
    );

    const resultData = Array.isArray(syncResult)
      ? syncResult[0]
      : syncResult;

    return {
      targetCount:
        resultData?.target_count ?? childrenJson.length,
      linkInserted:
        resultData?.facility_link_inserted ?? 0,
      linkDeleted:
        resultData?.facility_link_deleted ?? 0,
      deleteCandidates:
        resultData?.delete_candidate_count ?? 0,
      targetDate: result.target_date || '-',
      facilityId: facilityIdNum,
      syncResult,
    };
  };

  const handleClick = async () => {
    if (isDisabled) {
      return;
    }

    setIsLoading(true);
    setLabel('一括更新開始...');

    showInfoToast(
      'HUGの職員・児童データを一括同期しています',
      2000,
    );

    try {
      const activeWebview = resolveWebview();

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

      // 1. 職員同期
      const staffResult =
        await syncStaffs(activeWebview);

      // 職員同期が成功した場合のみ児童同期へ進む
      // 2. 児童同期
      const childrenResult =
        await syncChildren(activeWebview);

      setLabel('一括更新完了');

      showResultToast({
        title: 'HUG一括同期 完了',
        message: '職員・児童データの同期が完了しました',
        details: [
          `職員取得件数: ${staffResult.fetchedCount}件`,
          staffResult.totalCount != null
            ? `HUG職員登録件数: ${staffResult.totalCount}件`
            : '',
          `児童対象件数: ${childrenResult.targetCount}件`,
          `児童紐付け追加: ${childrenResult.linkInserted}件`,
          `児童紐付け削除: ${childrenResult.linkDeleted}件`,
          childrenResult.deleteCandidates > 0
            ? `児童削除候補: ${childrenResult.deleteCandidates}件`
            : '',
          `児童対象日: ${childrenResult.targetDate}`,
        ].filter(Boolean),
        duration: 8000,
      });
    } catch (error) {
      console.error(
        '[HUG一括同期] 同期エラー:',
        error,
      );

      let errorDetails =
        error?.message || String(error);

      if (error?.response?.data) {
        errorDetails += `\nサーバー応答: ${JSON.stringify(
          error.response.data,
        )}`;
      }

      showResultToast({
        title: 'HUG一括同期 エラー',
        message:
          '職員・児童データの一括同期を完了できませんでした',
        details: errorDetails,
        success: false,
        duration: 8000,
      });
    } finally {
      setIsLoading(false);
      setLabel('職員・児童更新');
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
        bg-emerald-600
        px-4
        py-2
        text-center
        text-sm
        text-white
        transition-colors
        hover:bg-emerald-700
        disabled:cursor-not-allowed
        disabled:opacity-60
        ${className}
      `}
      title="HUGの職員・児童データを順番に取得してDBへ一括同期"
    >
      <ArrowPathIcon
        className={`
          h-5
          w-5
          shrink-0
          ${isLoading ? 'animate-spin' : ''}
        `}
      />

      <span className="whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
