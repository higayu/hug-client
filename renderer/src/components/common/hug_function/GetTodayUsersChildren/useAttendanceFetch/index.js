import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";

import { useAppState } from "@/AppStateContext";
import { useToast } from "@/provider/ToastProvider/ToastContext";
import { executeFlowV2 } from "@/components/WebAutomationV2";
import {
  setExtractedData,
  setTableData,
} from "@/store/slices/attendanceSlice";

const AUTO_FETCH_INTERVAL_MS = 60_000;
const ATTENDANCE_FETCH_FLOW_KEY = "attendance_fetch_today_users";

/**
 * GetTodayUsersChildren 用の利用者データ取得処理（WebAutomation V2）
 *
 * Renderer側は取得・HTML解析の詳細を持たない。
 * DBに保存された attendance_fetch_today_users の仮想JS群を
 * executeFlowV2() で実行し、完成済みの結果だけを受け取る。
 *
 * DB Flow側:
 *   index.js
 *     -> fetch.js  : WebViewで出席表HTML取得
 *     -> parse.js  : RendererでHTML解析
 *     -> 完成結果をreturn
 *
 * Renderer側:
 *   executeFlowV2()
 *     -> Redux / AppStateへ保存
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
        console.error(
          `[${logTag}] 自動取得設定の保存に失敗:`,
          result
        );
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
      const facilityId =
        facilityIdOverride || FACILITY_ID || "1";

      const dateStr =
        dateStrOverride ||
        CURRENT_YMD ||
        new Date().toISOString().slice(0, 10);

      if (isFetchingRef.current) {
        console.log(
          `[${logTag}] 取得中のためスキップ`
        );
        return null;
      }

      isFetchingRef.current = true;

      try {
        if (!silent) {
          showInfoToast(
            "📥 利用者データ取得中..."
          );
        }

        // =====================================================
        // WebAutomation V2
        // =====================================================
        // ここから先の
        // ・HUG出席表HTML取得
        // ・HTML解析
        // ・児童ID / 氏名 / 入室 / 退室 / 編集URL抽出
        // はDBに保存された仮想JSファイル群が担当する。
        // =====================================================
        const result = await executeFlowV2(
          ATTENDANCE_FETCH_FLOW_KEY,
          {
            facilityId,
            dateStr,
          }
        );

        if (!result?.ok) {
          throw new Error(
            result?.error ||
              "利用者データ取得に失敗しました"
          );
        }

        const extracted = result?.extracted;

        if (!extracted?.success) {
          throw new Error(
            extracted?.error ||
              "利用者データ抽出に失敗しました"
          );
        }

        // =====================================================
        // Redux: 取得テーブル情報
        // =====================================================
        const tableData = {
          success: true,
          html: result.html || "",
          rowCount:
            result.rowCount ??
            extracted.rowCount ??
            0,
          pageTitle:
            result.pageTitle || "",
          pageUrl:
            result.pageUrl || "",
          facility_id: facilityId,
          date_str: dateStr,
        };

        dispatch(
          setTableData(tableData)
        );

        // =====================================================
        // Redux: 抽出済み利用者情報
        // =====================================================
        dispatch(
          setExtractedData(extracted)
        );

        // =====================================================
        // AppState
        // =====================================================
        const attendanceData = {
          facilityId,
          dateStr,
          extractedAt:
            new Date().toISOString(),
          rowCount:
            extracted.rowCount ??
            extracted.data?.length ??
            0,
          data:
            Array.isArray(extracted.data)
              ? extracted.data
              : [],
        };

        updateAppState({
          attendanceData,
        });

        // 既存処理との互換性維持
        if (window.AppState) {
          window.AppState.attendanceData =
            attendanceData;
        }

        if (!silent) {
          showInfoToast(
            `✅ 利用者データを抽出・保存しました。\n行数: ${
              attendanceData.rowCount
            }`
          );
        }

        console.log(
          `[${logTag}] WebAutomation V2 利用者データ取得完了`,
          {
            flowKey:
              ATTENDANCE_FETCH_FLOW_KEY,
            facilityId,
            dateStr,
            rowCount:
              attendanceData.rowCount,
            silent,
            pageUrl:
              result.pageUrl || null,
          }
        );

        return {
          success: true,
          result,
          attendanceData,
        };
      } catch (error) {
        const errorMessage =
          error?.message ||
          String(error);

        const isLoginError =
          errorMessage.includes("ログイン") ||
          errorMessage.includes("login");

        console.error(
          `[${logTag}] WebAutomation V2 利用者データ取得例外:`,
          error
        );

        // DB側Flowがログインページを検知した場合、
        // 自動取得中なら従来と同様にAutoを停止する。
        if (
          silent &&
          disableAutoFetchOnLoggedOut &&
          isLoginError
        ) {
          await setAutoFetchEnabled(false);
        }

        if (!silent) {
          if (isLoginError) {
            showInfoToast(
              "⚠️ HUGにログインしてから利用者データを取得してください"
            );
          } else {
            showInfoToast(
              `❌ エラー: ${errorMessage}`
            );
          }
        }

        return {
          success: false,
          error: errorMessage,
        };
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
    if (!autoFetchEnabled) {
      return;
    }

    runFetchRef.current({
      silent: true,
    });

    const intervalId = setInterval(
      () => {
        runFetchRef.current({
          silent: true,
        });
      },
      AUTO_FETCH_INTERVAL_MS
    );

    return () => {
      clearInterval(intervalId);
    };
  }, [autoFetchEnabled]);

  const toggleAutoFetch = useCallback(
    async () => {
      await setAutoFetchEnabled(
        !autoFetchEnabled
      );
    },
    [
      autoFetchEnabled,
      setAutoFetchEnabled,
    ]
  );

  return {
    runFetch,
    autoFetchEnabled,
    toggleAutoFetch,
  };
}
