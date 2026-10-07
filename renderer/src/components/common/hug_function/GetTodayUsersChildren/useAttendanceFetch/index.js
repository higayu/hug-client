import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { useAppState } from "@/AppStateContext";
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { isHugLoggedIn } from "@/hooks/useHugCache/isHugLoggedIn.js";
import { setExtractedData, setTableData } from "@/store/slices/attendanceSlice";
import {
  createAttendanceRuntime,
  executeFlowV2,
} from "@/components/WebAutomationV2";

const AUTO_FETCH_INTERVAL_MS = 60_000;

/**
 * GetTodayUsersChildren 用の利用者データ取得処理
 *
 * - HUG 側から当日の利用者データを取得
 * - HTML テーブルを抽出
 * - Redux / AppState に保存
 * - 自動取得 ON の場合は 60 秒ごとに再取得
 */
export function useAttendanceFetch(logTag = "GetTodayUsersChildren") {
  const dispatch = useDispatch();
  const { showInfoToast } = useToast();

  const {
    FACILITY_ID,
    CURRENT_YMD,
    iniState,
    updateAppState,
    updateIniSetting,
  } = useAppState();

  const autoFetchEnabled =
    iniState?.apiSettings?.autoAttendanceFetch === true ||
    iniState?.apiSettings?.autoAttendanceFetch === "true";
  const isFetchingRef = useRef(false);

  const setAutoFetchEnabled = useCallback(
    async (enabled) => {
      const result = await updateIniSetting(
        "apiSettings.autoAttendanceFetch",
        String(Boolean(enabled))
      );

      if (!result?.success) {
        console.error(`[${logTag}] 自動取得設定の保存に失敗:`, result);
        return false;
      }

      return true;
    },
    [logTag, updateIniSetting]
  );

  const runFetch = useCallback(
    async (options = {}) => {
      const {
        silent = false,
        facilityId: facilityIdOverride,
        dateStr: dateStrOverride,
        disableAutoFetchOnLoggedOut = silent,
      } = options;

      // 日付変更直後は CURRENT_YMD の state 更新より先に取得処理が走る可能性があるため、
      // 呼び出し元から渡された日付・施設IDを最優先する。
      const facilityId = facilityIdOverride || FACILITY_ID || "1";
      const dateStr =
        dateStrOverride || CURRENT_YMD || new Date().toISOString().slice(0, 10);

      if (isFetchingRef.current) {
        console.log(`[${logTag}] 取得中のためスキップ`);
        return;
      }

      isFetchingRef.current = true;

      try {
        const loggedIn = await isHugLoggedIn();
        if (!loggedIn) {
          console.warn(`[${logTag}] HUG未ログインのため取得をスキップ`);

          if (silent && disableAutoFetchOnLoggedOut) {
            await setAutoFetchEnabled(false);
          } else if (!silent) {
            showInfoToast("⚠️ HUGにログインしてから利用者データを取得してください");
          }

          return;
        }

        if (!silent) {
          showInfoToast("📥 利用者データ取得中...");
        }

        const runtime = createAttendanceRuntime({
          dispatch,
          updateAppState,
        });

        const result = await executeFlowV2(
          "attendance_fetch_today_users",
          {
            facilityId: String(facilityId),
            dateStr: String(dateStr),
          },
          { runtime },
        );

        const attendanceData = result?.context?.attendanceData || window.AppState?.attendanceData;

        if (!silent) {
          showInfoToast(
            `✅ 利用者データを抽出・保存しました。\n行数: ${
              attendanceData?.rowCount ?? "不明"
            }`
          );
        }

        console.log(`[${logTag}] 利用者データ取得完了(V2)`, {
          facilityId,
          dateStr,
          rowCount: attendanceData?.rowCount,
          silent,
        });
      } catch (e) {
        console.error(`[${logTag}] 利用者データ取得例外:`, e);

        if (!silent) {
          showInfoToast(`❌ エラー: ${e?.message || e}`);
        }
      } finally {
        isFetchingRef.current = false;
      }
    },
    [
      FACILITY_ID,
      CURRENT_YMD,
      dispatch,
      updateAppState,
      showInfoToast,
      logTag,
      setAutoFetchEnabled,
    ]
  );

  const runFetchRef = useRef(runFetch);
  runFetchRef.current = runFetch;

  useEffect(() => {
    if (!autoFetchEnabled) return;

    runFetchRef.current({ silent: true });

    const intervalId = setInterval(() => {
      runFetchRef.current({ silent: true });
    }, AUTO_FETCH_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [autoFetchEnabled]);

  const toggleAutoFetch = useCallback(async () => {
    await setAutoFetchEnabled(!autoFetchEnabled);
  }, [autoFetchEnabled, setAutoFetchEnabled]);

  return {
    runFetch,
    autoFetchEnabled,
    toggleAutoFetch,
  };
}
