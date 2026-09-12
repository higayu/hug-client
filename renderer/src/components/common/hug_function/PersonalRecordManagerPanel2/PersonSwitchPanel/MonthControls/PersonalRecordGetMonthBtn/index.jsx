import { useCallback, useRef, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { useSelector } from "react-redux";
import { selectSpaceChildId } from "@/store/slices/chilledspaceSlice.js";
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { fetchPersonalRecord2 } from "./fetchPersonalRecord2";
import { postServiceRecordsToLocalApi } from "./postServiceRecordsToLocalApi";
import { useDataBase } from "@/hooks/useDataBase";

const LOG_TAG = "PersonalRecordGet";

function notifyPostResultToasts(
  postResult,
  { showSuccessToast, showErrorToast }
) {
  const { posted = 0, failed = 0 } = postResult ?? {};

  if (posted > 0) {
    showSuccessToast(
      posted === 1
        ? "個人記録を保存しました"
        : `${posted}件の個人記録を保存しました`
    );
  }

  if (failed > 0) {
    showErrorToast("個人記録の保存に失敗しました");
  }
}

/**
 * YYYY-MM-DD → YYYY-MM に変換
 */
const toMonthStr = (value) => {
  if (!value) return "";

  // すでに YYYY-MM の場合
  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  // YYYY-MM-DD の場合
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(0, 7);
  }

  return "";
};

/**
 * 選択中児童の個人記録を取得し、ローカルDBへ保存するボタン
 *
 * @param {string} monthStr YYYY-MM形式
 * @param {boolean} disabled 親コンポーネントから渡される使用不可フラグ
 */
export default function PersonalRecordGetMonthBtn({
  spaceId,
  monthStr,
  disabled = false,
  onServiceRecordsUpdated,
  onDebugResult,
}) {
  const {
    FACILITY_ID,
    STAFF_ID,
    CURRENT_YMD,
    DATABASE_TYPE,
  } = useAppState();

  const selectedChildId = useSelector(selectSpaceChildId(spaceId));

  const {
    showSuccessToast,
    showErrorToast,
  } = useToast();

  const [fetching, setFetching] = useState(false);
  const [permissionErrorCount, setPermissionErrorCount] = useState(0);
  const isFetchingRef = useRef(false);
  const { loadDataBase } = useDataBase();

  const runFetch = useCallback(async () => {
    // 親コンポーネントから使用不可にされている場合
    if (disabled) {
      console.warn(`[${LOG_TAG}] 使用不可のため処理を中止しました`);
      return;
    }

    if (!selectedChildId) {
      console.warn(`[${LOG_TAG}] 児童が選択されていません`);
      return;
    }

    if (isFetchingRef.current) {
      console.log(`[${LOG_TAG}] 取得中のためスキップ`);
      return;
    }

    const facilityId = FACILITY_ID || "3";

    // monthStr は親から渡される YYYY-MM 形式
    // CURRENT_YMD は YYYY-MM-DD 形式なので変換する
    const yearMonth = monthStr || toMonthStr(CURRENT_YMD);

    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) {
      console.error(`[${LOG_TAG}] 年月形式が不正: ${yearMonth}`);
      showErrorToast("年月の形式が不正です");
      return;
    }

    isFetchingRef.current = true;
    setFetching(true);
    setPermissionErrorCount(0);

    console.log(`[${LOG_TAG}] 取得開始`, {
      childId: selectedChildId,
      facilityId,
      yearMonth,
    });

    try {
      const result = await fetchPersonalRecord2({
        childId: selectedChildId,
        facilityId,
        year_month: yearMonth,
      });

      onDebugResult?.(result);

      if (!result.ok) {
        console.error(`[${LOG_TAG}] 取得失敗:`, result.error);
        showErrorToast("個人記録の取得に失敗しました");
        return;
      }

      console.log(`[${LOG_TAG}] 取得完了`, {
        listUrl: result.listUrl,
        rowCount: result.rowCount,
        presentCount: result.presentCount,
      });

      console.log(`[${LOG_TAG}] records:`, result.records);

      result.records?.forEach((row) => {
        console.log(`[${LOG_TAG}] ${row.date} ${row.childName}`, {
          attendance: row.attendance,
          note: row.note,
          noteError: row.noteError,
          permissionError: row.permissionError === true,
          editPath: row.editPath,
        });
      });

      const fetchedPermissionErrorCount =
        result.permissionErrors?.length ??
        result.records?.filter((row) => row?.permissionError === true).length ??
        0;

      setPermissionErrorCount(fetchedPermissionErrorCount);

      const postResult = await postServiceRecordsToLocalApi(
        result.records,
        {
          childrenId: selectedChildId,
          facilityId,
          staffId: STAFF_ID,
          databaseType: DATABASE_TYPE,
        }
      );

      console.log(`[${LOG_TAG}] ローカルDB保存`, postResult);

      const savedPermissionErrorCount =
        postResult?.permissionErrors?.length ??
        postResult?.results?.filter((row) => row?.permissionError === true).length ??
        0;

      setPermissionErrorCount(savedPermissionErrorCount);

      notifyPostResultToasts(postResult, {
        showSuccessToast,
        showErrorToast,
      });

      postResult.results?.forEach((row) => {
        if (row.ok) {
          console.log(
            `[${LOG_TAG}] Upsert成功 ${row.date}`,
            row.payload
          );
        } else if (row.skipped) {
          console.warn(
            `[${LOG_TAG}] Upsertスキップ ${row.date}:`,
            row.error
          );
        } else {
          console.error(
            `[${LOG_TAG}] Upsert失敗 ${row.date}:`,
            row.error
          );
        }
      });

      await loadDataBase({
        reason: "manual/ProfessionalPlan",
      });
      onServiceRecordsUpdated?.();
    } catch (error) {
      onDebugResult?.({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`[${LOG_TAG}] 例外:`, error);
      showErrorToast(
        "個人記録の取得・保存でエラーが発生しました"
      );
    } finally {
      isFetchingRef.current = false;
      setFetching(false);
    }
  }, [
    disabled,
    FACILITY_ID,
    STAFF_ID,
    DATABASE_TYPE,
    CURRENT_YMD,
    monthStr,
    showSuccessToast,
    showErrorToast,
    loadDataBase,
    onServiceRecordsUpdated,
    onDebugResult,
  ]);

  const isDisabled =
    disabled ||
    !selectedChildId ||
    !(monthStr || CURRENT_YMD) ||
    fetching;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        id="personal-record-get"
        onClick={runFetch}
        disabled={isDisabled}
        className="
          flex items-center justify-center
          bg-green-700 text-gray-50
          px-3 py-2
          rounded-lg font-bold text-xs
          cursor-pointer transition-all whitespace-nowrap
          hover:bg-green-800 hover:scale-105
          active:bg-green-900 active:scale-[0.97]
          disabled:grayscale disabled:opacity-50
          disabled:cursor-not-allowed
          disabled:hover:scale-100
        "
      >
        {fetching ? "取得中…" : "記録取得"}
      </button>

      {permissionErrorCount > 0 && (
        <span
          className="inline-flex items-center rounded-full border border-red-300 bg-red-50 px-2.5 py-1 text-xs font-bold text-red-700"
          title="編集権限がないため取得できなかった個人記録があります"
        >
          権限不足 {permissionErrorCount}件
        </span>
      )}
    </div>
  );
}
