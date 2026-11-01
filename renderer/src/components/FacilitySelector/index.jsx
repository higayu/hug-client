import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from 'react';

import { useSelector } from 'react-redux';

import {
  selectFacilityId,
} from '@/store/slices/appStateSlice';

import {  useToast,} from '@/utils/notifications.jsx'

import {
  useAppState,
} from '@/AppStateContext';

const TITLE =
  '設定 > 設定編集 > API設定 から設定してください';

function FacilitySelector() {
  const { showInfoToast } = useToast();

  /*
   * 現在選択中の施設ID
   */
  const facilityId = useSelector(
    selectFacilityId,
  );

  /*
   * データベースから取得した施設一覧
   *
   * FALLBACK_FACILITYSは使用せず、
   * useAppStateのdatabaseState.facilitysだけを使用する。
   */
  const { databaseState } = useAppState();
  console.log("databaseStateの値",databaseState);
  /*
   * onMouseDownとonContextMenuの二重発火防止
   */
  const lastRightClickHandledAtRef =
    useRef(0);

  /**
   * DBから取得した施設一覧
   *
   * databaseState.facilitysが未取得の場合は
   * 空配列として扱う。
   */
  const facilitys = useMemo(() => {
    if (
      !Array.isArray(
        databaseState?.facilitys,
      )
    ) {
      return [];
    }

    return databaseState.facilitys
      .filter((facility) => {
        return (
          facility &&
          facility.id !== undefined &&
          facility.id !== null
        );
      })
      .map((facility) => ({
        id: facility.id,
        name:
          facility.name ||
          `施設ID: ${facility.id}`,
        url: facility.url || '',
      }));
  }, [databaseState?.facilitys]);

  /**
   * 現在選択中の施設情報
   */
  const currentFacility = useMemo(() => {
    const currentFacilityId = String(
      facilityId ?? '',
    );

    if (!currentFacilityId) {
      return null;
    }

    return (
      facilitys.find((facility) => {
        return (
          String(facility.id) ===
          currentFacilityId
        );
      }) || null
    );
  }, [facilityId, facilitys]);

  /**
   * 画面に表示する施設名
   */
  const facilityLabel = useMemo(() => {
    if (
      facilitys.length === 0
    ) {
      return '施設データなし';
    }

    return (
      currentFacility?.name ||
      '未設定'
    );
  }, [
    facilitys.length,
    currentFacility,
  ]);

  /**
   * デバッグログ
   */
  useEffect(() => {
    console.log(
      '📦 [FacilitySelector] DB施設データ:',
      facilitys,
    );

    console.log(
      '🏢 [FacilitySelector] 現在の施設:',
      {
        facilityId,
        facilityLabel,
        currentFacility,
      },
    );
  }, [
    facilitys,
    facilityId,
    facilityLabel,
    currentFacility,
  ]);

  /**
   * 設定フォルダーを開く
   */
  const openConfigFolder =
    useCallback(async () => {
      try {
        if (
          !window.electronAPI
            ?.openConfigFolder
        ) {
          showInfoToast(
            '❌ 設定フォルダーを開く機能が見つかりません',
          );

          console.error(
            '❌ [FacilitySelector] window.electronAPI.openConfigFolder が存在しません',
          );

          return;
        }

        const result =
          await window.electronAPI.openConfigFolder();

        if (result?.success) {
          showInfoToast(
            '📁 設定フォルダーを開きました',
          );

          console.log(
            '✅ 設定フォルダーを開きました:',
            result.path,
          );

          return;
        }

        showInfoToast(
          `❌ 設定フォルダーを開けませんでした: ${
            result?.error ||
            '不明なエラー'
          }`,
        );

        console.error(
          '❌ 設定フォルダーを開く失敗:',
          result?.error,
        );
      } catch (error) {
        showInfoToast(
          '❌ 設定フォルダーを開く際にエラーが発生しました',
        );

        console.error(
          '❌ 設定フォルダーを開くエラー:',
          error,
        );
      }
    }, [showInfoToast]);

  /**
   * 右クリックで設定フォルダーを開く
   */
  const handleOpenConfigFolder =
    useCallback(
      async (event) => {
        event.preventDefault();
        event.stopPropagation();

        const now = Date.now();

        /*
         * onMouseDownとonContextMenuが連続して
         * 発生した場合の二重実行防止
         */
        if (
          now -
            lastRightClickHandledAtRef.current <
          500
        ) {
          return;
        }

        lastRightClickHandledAtRef.current =
          now;

        console.log(
          '🖱️ [FacilitySelector] 右クリック検知 → 設定フォルダーを開く',
        );

        await openConfigFolder();
      },
      [openConfigFolder],
    );

  /**
   * 右マウスボタンの押下を検出
   */
  const handleMouseDown =
    useCallback(
      (event) => {
        /*
         * 右クリックだけ処理する
         */
        if (event.button !== 2) {
          return;
        }

        handleOpenConfigFolder(
          event,
        );
      },
      [handleOpenConfigFolder],
    );

  /**
   * 施設名クリック
   */
  const handleFacilityLabelClick =
    useCallback(() => {
      showInfoToast(TITLE);

      console.log(
        '🏢 [FacilitySelector] 施設ラベルクリック:',
        {
          facilityId,
          facilityLabel,
          currentFacility,
          message: TITLE,
        },
      );
    }, [
      showInfoToast,
      facilityId,
      facilityLabel,
      currentFacility,
    ]);

  return (
    <div
      className="
        flex
        items-center
        gap-1
      "
      title={TITLE}
      onContextMenu={
        handleOpenConfigFolder
      }
      onMouseDown={handleMouseDown}
    >
      {/* 右クリックは外側divで拾う */}
      <button
        type="button"
        className="
          flex-shrink-0
          rounded
          p-1.5
          text-white
          transition-colors
          duration-200
          hover:bg-yellow-600
        "
        title="
          右クリック:
          設定フォルダーを開く
          （Database設定がずれた時の救済措置）
        "
      >
        施設:
      </button>

      {/* 表示専用ラベル */}
      <button
        type="button"
        id="facilityLabel"
        data-facility-id={
          currentFacility?.id ??
          facilityId ??
          ''
        }
        data-facility-url={
          currentFacility?.url || ''
        }
        title={TITLE}
        onClick={
          handleFacilityLabelClick
        }
        className="
          js_c_f_id
          inline-flex
          min-w-[96px]
          items-center
          rounded
          border
          border-[#ddd]
          bg-gray-100
          px-2
          py-1
          text-sm
          text-gray-700
          transition-colors
          duration-200
          hover:bg-gray-200
        "
      >
        {facilityLabel}
      </button>
    </div>
  );
}

export default FacilitySelector;