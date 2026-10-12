import { CheckCircleIcon } from "@heroicons/react/24/outline";
import { useSelector } from "react-redux";

import PersonalRecordButton from "../PersonalRecordButton";

import { usePersonRecordCheck } from "./usePersonRecordCheck";

import {
  selectCurrentYmd,
} from "@/store/slices/appStateSlice.js";

import { selectPersonalRecordStatus } from "@/store/slices/recordStatusSlice.js";

/**
 * 本日の個人記録登録状態ラベル
 *
 * @param {boolean | null | undefined} registered
 * @param {boolean} checking
 */
export const personalRecordRegisteredLabel = (registered, checking) => {
  if (checking) return "確認中…";
  if (registered === true) return "済";
  if (registered === false) return "未";

  return "未";
};

/**
 * 本日の個人記録登録状態の文字色
 *
 * @param {boolean | null | undefined} registered
 * @param {boolean} checking
 */
export const getPersonalRecordRegisteredClass = (registered, checking) => {
  if (checking) return "text-gray-400";

  if (registered === true) {
    return "text-green-400";
  }

  if (registered === false) {
    return "text-orange-400";
  }

  return "text-gray-400";
};

/**
 * 本日の個人記録登録状態表示
 */
export function PersonalRecordRegisteredStatus({
  registered,
  checking,
  recordCount,
}) {
  const registeredText = personalRecordRegisteredLabel(registered, checking);
  const registeredClass = getPersonalRecordRegisteredClass(
    registered,
    checking
  );

  return (
    <span
      className={`font-bold ${registeredClass}`}
      title={
        recordCount != null
          ? `記録件数：${recordCount}件`
          : "記録件数：未取得"
      }
    >
      {registeredText}
    </span>
  );
}

/**
 * 個人記録チェックパネル（展開メニューなし）
 * 閉じた状態の個人記録ボタンと登録状態の確認操作を維持する。
 */
export default function PersonalRecordMgPanel({
  className = "",
  selectedChildId = "",
  selectedChildName = "",
}) {
  const { checking, runCheck } = usePersonRecordCheck(selectedChildId);
  const currentYmd = useSelector(selectCurrentYmd);
  const personalRecordStatus = useSelector((state) =>
    selectPersonalRecordStatus(state, currentYmd, selectedChildId)
  );

  const todayPersonalRecordRegistered = personalRecordStatus.registered;
  const todayPersonalRecordCount = personalRecordStatus.recordCount;

  return (
    <div
      className={`inline-flex h-9 max-w-full min-w-0 items-stretch overflow-hidden rounded-md border border-gray-600 bg-gray-800 text-xs text-gray-200 ${className}`}
    >
      <PersonalRecordButton
        selectedChildId={selectedChildId}
        selectedChildName={selectedChildName}
        currentYmd={currentYmd}
        disabled={!selectedChildId}
        label="個人記録"
        className="flex h-full shrink-0 items-center justify-center rounded-none border-0 border-r border-gray-600 bg-[#00a405] px-2 text-xs font-bold whitespace-nowrap text-white transition-all hover:bg-[#006305] active:bg-[#005004] disabled:cursor-not-allowed disabled:opacity-40"
      />

      <button
        type="button"
        onClick={runCheck}
        disabled={checking || !selectedChildId}
        title="本日の個人記録登録状態を確認"
        aria-label="本日の個人記録登録状態を再確認"
        className="inline-flex min-w-0 items-center gap-2 bg-transparent px-2 text-xs text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-inset focus:ring-green-400 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="inline-flex min-w-0 items-center gap-1 whitespace-nowrap">
          <span className="text-gray-400">本日</span>
          <PersonalRecordRegisteredStatus
            registered={todayPersonalRecordRegistered}
            checking={checking}
            recordCount={todayPersonalRecordCount}
          />
          {todayPersonalRecordRegistered === true && (
            <CheckCircleIcon
              className="h-4 w-4 shrink-0 text-green-400"
              title="本日の個人記録登録済み"
              aria-label="本日の個人記録登録済み"
            />
          )}
        </span>
        {todayPersonalRecordCount != null && (
          <span className="shrink-0 whitespace-nowrap text-gray-400">
            {todayPersonalRecordCount}件
          </span>
        )}
      </button>

    </div>
  );
}
