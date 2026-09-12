import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAppState } from "@/AppStateContext";
import { usePatchChildUseSpeDate } from "@/components/common/hug_function/GetTodayUsersChildren/SelectChildFilter/usePatchChildUseSpeDate";
import {
  selectCurrentYmd,
  selectFacilityId,
} from "@/store/slices/appStateSlice.js";
import {
  selectActiveSpaceId,
  selectSpaceChildId,
} from "@/store/slices/chilledspaceSlice.js";
import {
  setProfessionalSupportStatus,
  setRecordStatusError,
} from "@/store/slices/recordStatusSlice.js";
import { fetchProfessionalSupportUseDaysViaHugTab } from "./fetchHook1";

/**
 * 専門的支援実施加算の利用日数チェック
 *
 * 方針:
 * - childrenData は useDataBase から取らない
 * - childrenData は AppState / Redux 側の正本を読む
 *
 * 新処理:
 * - HUG の record_proceedings.php を POST 検索
 * - 月初〜指定日までの専門的支援実施加算の保存済み件数を取得
 * - 取得件数を useSpeDate に反映する
 * - 取得結果を recordStatusSlice に保存する
 */
export function useProfessionalSupportCheck2(
  spaceId,
  logTag = "ProfessionalSupportCheck2"
) {
  const dispatch = useDispatch();

  const {
    FACILITY_ID,
    CURRENT_YMD,

    // loadDataBase() が AppState に保存したデータを読む
    childrenData,
  } = useAppState();

  const activeSpaceId = useSelector(selectActiveSpaceId);
  const effectiveSpaceId = spaceId || activeSpaceId;
  const selectedChildIdFromStore = useSelector(
    selectSpaceChildId(effectiveSpaceId)
  );
  const facilityIdFromStore = useSelector(selectFacilityId);
  const currentYmdFromStore = useSelector(selectCurrentYmd);

  const { patchChildUseSpeDate } = usePatchChildUseSpeDate();

  const safeChildrenData = useMemo(() => {
    return Array.isArray(childrenData) ? childrenData : [];
  }, [childrenData]);

  console.log(`[HUG WM] 当日の日付 store値（${logTag}）`, {
    currentYmdFromStore,
    currentYmdFromStoreType: typeof currentYmdFromStore,
  });

  const effectiveChildId = selectedChildIdFromStore;
  const effectiveFacilityId = facilityIdFromStore || FACILITY_ID || "3";
  const effectiveCurrentYmd = currentYmdFromStore || CURRENT_YMD;

  console.log(`[HUG WM] 有効な取得条件 初期解決（${logTag}）`, {
    selectedChildIdFromStore,
    facilityIdFromStore,
    currentYmdFromStore,
    FACILITY_ID,
    CURRENT_YMD,
    effectiveChildId,
    effectiveFacilityId,
    effectiveCurrentYmd,
    effectiveCurrentYmdType: typeof effectiveCurrentYmd,
  });

  const selectedChild = useMemo(() => {
    if (!effectiveChildId) return null;

    const selectedId = String(effectiveChildId);

    return (
      safeChildrenData.find(
        (c) => String(c.children_id) === selectedId
      ) || null
    );
  }, [safeChildrenData, effectiveChildId]);

  const useDays = selectedChild?.useSpeDate ?? null;

  /**
   * 月初〜指定日までの専門的支援実施加算の保存済み件数
   */
  const [
    todayProfessionalSupportRecordCount,
    setTodayProfessionalSupportRecordCount,
  ] = useState(null);

  /**
   * 直近の HUG 利用日数取得結果
   */
  const [lastUseDaysResult, setLastUseDaysResult] = useState(null);

  /**
   * @type {'raw' | null}
   * 新機能では個人記録による補正をしないため raw のみ
   */
  const [useDaysDisplayKind, setUseDaysDisplayKind] = useState(null);

  const [checking, setChecking] = useState(false);

  /**
   * 日付比較用の正規化
   *
   * 例:
   * - 2025-01-09
   * - 2025/01/09
   * - 20250109
   * - 2025-01-09 10:20:30
   *
   * これらを 2025-01-09 に寄せる
   */
  const normalizeYmdForDebug = useCallback((value) => {
    if (value == null) return null;

    const text = String(value).trim();
    const digits = text.replace(/[^\d]/g, "");

    if (digits.length >= 8) {
      return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(
        6,
        8
      )}`;
    }

    return text;
  }, []);

  useEffect(() => {
    console.log(`[HUG WM] 専門的支援チェック 状態リセット（${logTag}）`, {
      effectiveChildId,
      effectiveCurrentYmd,
      normalizedEffectiveCurrentYmd: normalizeYmdForDebug(effectiveCurrentYmd),
      previousRecordCount: todayProfessionalSupportRecordCount,
      previousDisplayKind: useDaysDisplayKind,
      previousLastUseDaysResult: lastUseDaysResult,
    });

    setTodayProfessionalSupportRecordCount(null);
    setUseDaysDisplayKind(null);
    setLastUseDaysResult(null);
  }, [
    effectiveChildId,
    effectiveCurrentYmd,
    logTag,
    normalizeYmdForDebug,
  ]);

  const runCheck = useCallback(async () => {
    console.groupCollapsed(`[HUG WM] 専門的支援チェック開始（${logTag}）`);

    console.log(`[HUG WM] 取得条件の解決結果（${logTag}）`, {
      store: {
        selectedChildIdFromStore,
        facilityIdFromStore,
        currentYmdFromStore,
      },
      appState: {
            FACILITY_ID,
        CURRENT_YMD,
      },
      effective: {
        childId: effectiveChildId,
        facilityId: effectiveFacilityId,
        currentYmd: effectiveCurrentYmd,
        normalizedCurrentYmd: normalizeYmdForDebug(effectiveCurrentYmd),
      },
    });

    console.log(`[HUG WM] childrenData 検索結果（${logTag}）`, {
      childrenDataLength: safeChildrenData.length,
      selectedChild,
      currentUseDays: useDays,
    });

    if (!effectiveChildId) {
      console.warn(`[HUG WM] 専門的支援チェック中断（${logTag}）`, {
        reason: "子どもが未選択",
        effectiveChildId,
      });

      console.groupEnd();
      alert("子どもを選択してください");
      return;
    }

    if (!effectiveCurrentYmd) {
      console.warn(`[HUG WM] 専門的支援チェック中断（${logTag}）`, {
        reason: "対象日付が未設定",
        effectiveCurrentYmd,
        currentYmdFromStore,
        CURRENT_YMD,
      });

      console.groupEnd();
      alert("対象日付が取得できませんでした");
      return;
    }

    setChecking(true);
    setTodayProfessionalSupportRecordCount(null);
    setUseDaysDisplayKind(null);
    setLastUseDaysResult(null);

    console.log(`[HUG WM] チェック状態を初期化（${logTag}）`, {
      checking: true,
      todayProfessionalSupportRecordCount: null,
      useDaysDisplayKind: null,
      lastUseDaysResult: null,
    });

    const requestPayload = {
      childId: effectiveChildId,
      facilityId: effectiveFacilityId,
      currentYmd: effectiveCurrentYmd,
    };

    const timerLabel = `[HUG WM] HUG利用日数取得時間（${logTag}）`;

    try {
      console.log(`[HUG WM] HUG利用日数取得リクエスト送信（${logTag}）`, {
        requestPayload,
      });

      console.time(timerLabel);

      const useDaysResult = await fetchProfessionalSupportUseDaysViaHugTab(
        requestPayload
      );

      console.timeEnd(timerLabel);

      console.log(`[HUG WM] HUG利用日数取得レスポンス受信（${logTag}）`, {
        useDaysResult,
        ok: useDaysResult?.ok,
        days: useDaysResult?.days,
        daysType: typeof useDaysResult?.days,
        rows: useDaysResult?.rows,
        rowsIsArray: Array.isArray(useDaysResult?.rows),
        rowsLength: Array.isArray(useDaysResult?.rows)
          ? useDaysResult.rows.length
          : null,
        error: useDaysResult?.error,
      });

      setLastUseDaysResult(useDaysResult);

      console.log(`[HUG WM] lastUseDaysResult 保存（${logTag}）`, {
        lastUseDaysResult: useDaysResult,
      });

      if (!useDaysResult?.ok) {
        const errorMessage =
          useDaysResult?.error || "利用日数の取得に失敗しました";

        dispatch(
          setRecordStatusError({
            ymd: effectiveCurrentYmd,
            childId: effectiveChildId,
            kind: "professionalSupport",
            error: errorMessage,
          })
        );

        console.error(
          `[${logTag}] 専門的支援チェック失敗:`,
          errorMessage,
          {
            requestPayload,
            useDaysResult,
            effectiveChildId,
            effectiveFacilityId,
            effectiveCurrentYmd,
          }
        );

        alert(errorMessage);
        return;
      }

      const rawDays =
        typeof useDaysResult.days === "number" ? useDaysResult.days : 0;

      /**
       * 当日判定デバッグ
       *
       * rows が「月初〜指定日まで」の一覧の場合、
       * rows.length をそのまま registered 判定に使うと、
       * 当日ではなく月累計で registered=true になる可能性がある。
       */
      console.groupCollapsed(`[HUG WM] 当日判定デバッグ（${logTag}）`);

      const targetYmdForDebug = normalizeYmdForDebug(effectiveCurrentYmd);

      const rowsForDebug = Array.isArray(useDaysResult.rows)
        ? useDaysResult.rows
        : [];

      console.log(`[HUG WM] 当日判定 入力値（${logTag}）`, {
        effectiveCurrentYmd,
        effectiveCurrentYmdType: typeof effectiveCurrentYmd,
        targetYmdForDebug,
        requestPayload,
        responseDays: useDaysResult.days,
        responseRowsLength: rowsForDebug.length,
        responseRows: rowsForDebug,
      });

      const rowsWithDateDebug = rowsForDebug.map((row, index) => {
        /**
         * HUG側のrowの日付キーが不明なため候補を広めに見る。
         * console.table の rawDateCandidate が null の場合は、
         * 実際の rows の日付キーをここに追加してください。
         */
        const dateCandidate =
          row?.ymd ??
          row?.date ??
          row?.use_date ??
          row?.service_date ??
          row?.target_date ??
          row?.record_date ??
          row?.support_date ??
          row?.provided_date ??
          row?.day ??
          row?.created_date ??
          row?.created_at ??
          row?.updated_at ??
          null;

        const normalizedRowYmd = normalizeYmdForDebug(dateCandidate);

        return {
          index,
          rawDateCandidate: dateCandidate,
          rawDateCandidateType: typeof dateCandidate,
          normalizedRowYmd,
          targetYmd: targetYmdForDebug,
          isToday: normalizedRowYmd === targetYmdForDebug,
          row,
        };
      });

      const todayRowsForDebug = rowsWithDateDebug.filter((item) => {
        return item.isToday;
      });

      console.table(
        rowsWithDateDebug.map((item) => ({
          index: item.index,
          rawDateCandidate: item.rawDateCandidate,
          rawDateCandidateType: item.rawDateCandidateType,
          normalizedRowYmd: item.normalizedRowYmd,
          targetYmd: item.targetYmd,
          isToday: item.isToday,
        }))
      );

      console.log(`[HUG WM] 当日判定 rows詳細（${logTag}）`, {
        rowsWithDateDebug,
      });

      console.log(`[HUG WM] 当日判定 結果（${logTag}）`, {
        targetYmdForDebug,
        totalRows: rowsForDebug.length,
        todayRowsCount: todayRowsForDebug.length,
        todayRows: todayRowsForDebug,
      });

      console.groupEnd();

      const monthlyRecordCount =
        rowsForDebug.length > 0 ? rowsForDebug.length : rawDays;

      const todayRecordCount = Array.isArray(useDaysResult.rows)
        ? todayRowsForDebug.length
        : rawDays;

      /**
       * 当日の登録判定
       *
       * 既存どおり月初〜指定日までの件数で判定したい場合:
       *   const recordCount = monthlyRecordCount;
       *   const registered = monthlyRecordCount > 0;
       *
       * 当日のみで判定したい場合:
       *   const recordCount = todayRecordCount;
       *   const registered = todayRecordCount > 0;
       */
      const recordCount = todayRecordCount;
      const registered = todayRecordCount > 0;

      console.log(`[HUG WM] 登録判定カウント比較（${logTag}）`, {
        monthlyRecordCount,
        todayRecordCount,
        finalRecordCount: recordCount,
        registered,
        rawDays,
        note: "現在は当日判定として todayRecordCount を使用しています",
      });

      console.log(`[HUG WM] 取得結果 days 正規化（${logTag}）`, {
        originalDays: useDaysResult.days,
        originalDaysType: typeof useDaysResult.days,
        normalizedRawDays: rawDays,
        monthlyRecordCount,
        todayRecordCount,
        recordCount,
        registered,
      });

      console.log(`[HUG WM] 状態更新前（${logTag}）`, {
        beforeUseDays: useDays,
        beforeSelectedChild: selectedChild,
        beforeRecordCount: todayProfessionalSupportRecordCount,
        beforeDisplayKind: useDaysDisplayKind,
        beforeLastUseDaysResult: lastUseDaysResult,
      });

      patchChildUseSpeDate(effectiveChildId, rawDays);

      console.log(`[HUG WM] childrenData useSpeDate 反映実行（${logTag}）`, {
        childId: effectiveChildId,
        patchedUseSpeDate: rawDays,
      });

      setUseDaysDisplayKind("raw");
      setTodayProfessionalSupportRecordCount(recordCount);

      dispatch(
        setProfessionalSupportStatus({
          ymd: effectiveCurrentYmd,
          childId: effectiveChildId,
          registered,
          recordCount,
          useDays: rawDays,
          useDaysDisplayKind: "raw",
          lastUseDaysResult: useDaysResult,
        })
      );

      console.log(`[HUG WM] recordStatusSlice 保存完了（${logTag}）`, {
        ymd: effectiveCurrentYmd,
        childId: effectiveChildId,
        professionalSupport: {
          registered,
          recordCount,
          monthlyRecordCount,
          todayRecordCount,
          useDays: rawDays,
          useDaysDisplayKind: "raw",
          lastUseDaysResult: useDaysResult,
        },
      });

      console.log(`[HUG WM] 状態更新後 setState 実行（${logTag}）`, {
        useDaysDisplayKind: "raw",
        todayProfessionalSupportRecordCount: recordCount,
        lastUseDaysResult: useDaysResult,
        displayUseDays: rawDays,
      });

      console.log(`[HUG WM] 専門的支援 利用日数チェック完了（${logTag}）`, {
        requestPayload,
        response: useDaysResult,
        rawDays,
        monthlyRecordCount,
        todayRecordCount,
        recordCount,
        registered,
        displayKind: "raw",
      });

      console.log("[HUG WM] 表示用の利用日数:", rawDays, "日");
    } catch (e) {
      try {
        console.timeEnd(timerLabel);
      } catch {
        // console.timeEnd が二重実行になる環境対策
      }

      const errorMessage = String(e?.message || e);

      const errorResult = {
        ok: false,
        error: errorMessage,
      };

      setLastUseDaysResult(errorResult);

      dispatch(
        setRecordStatusError({
          ymd: effectiveCurrentYmd,
          childId: effectiveChildId,
          kind: "professionalSupport",
          error: errorMessage,
        })
      );

      console.error(`[${logTag}] 専門的支援チェック例外:`, e, {
        requestPayload,
        effectiveChildId,
        effectiveFacilityId,
        effectiveCurrentYmd,
        errorResult,
      });

      alert(errorMessage);
    } finally {
      console.log(`[HUG WM] 専門的支援チェック終了（${logTag}）`, {
        effectiveChildId,
        effectiveFacilityId,
        effectiveCurrentYmd,
        checking: false,
      });

      setChecking(false);
      console.groupEnd();
    }
  }, [
    dispatch,
    FACILITY_ID,
    CURRENT_YMD,
    selectedChildIdFromStore,
    facilityIdFromStore,
    currentYmdFromStore,
    effectiveChildId,
    effectiveFacilityId,
    effectiveCurrentYmd,
    safeChildrenData,
    selectedChild,
    useDays,
    todayProfessionalSupportRecordCount,
    useDaysDisplayKind,
    lastUseDaysResult,
    patchChildUseSpeDate,
    logTag,
    normalizeYmdForDebug,
  ]);

  return {
    useDays,
    useDaysDisplayKind,
    todayProfessionalSupportRegistered:
      todayProfessionalSupportRecordCount != null
        ? todayProfessionalSupportRecordCount > 0
        : null,
    todayProfessionalSupportRecordCount,
    lastUseDaysResult,
    checking,
    runCheck,
  };
}