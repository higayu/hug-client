// @/common/hug_function/PersonalRecordManagerPanel2/SwitchPanel/index.jsx
import { useState } from "react";
import MonthControls from "./MonthControls";
import DayControls from "./DayControls";

const PERIOD_TYPES = {
  MONTH: "month",
  DAY: "day",
};

export { PERIOD_TYPES };

/**
 * 月単位・日付単位の取得操作を切り替える専用パネル
 */
export default function PersonSwitchPanel({
  spaceId,
  value,
  onChange,
  month,
  onMonthChange,
  date,
  onDateChange,
  disabled = false,
  onServiceRecordsUpdated,
  className=''
}) {
  const [debugResult, setDebugResult] = useState(null);
  const isMonth = value === PERIOD_TYPES.MONTH;

  const nextValue = isMonth
    ? PERIOD_TYPES.DAY
    : PERIOD_TYPES.MONTH;

  const currentLabel = isMonth
    ? "月"
    : "day";

  const nextLabel = isMonth
    ? "日付単位"
    : "月単位";

  const handleToggle = () => {
    onChange(nextValue);
  };

  return (
    <div className="w-full">
      <div className={className}>
      {/* 切替ボタン */}
      <button
        type="button"
        onClick={handleToggle}
        aria-label={`${nextLabel}に切り替える`}
        aria-pressed={!isMonth}
        className={`
          flex h-10 w-10 shrink-0
          items-center justify-center
          whitespace-nowrap
          rounded-full border
          text-sm font-bold text-white
          cursor-pointer transition-all
          hover:scale-105
          active:scale-[0.97]
          ${
            isMonth
              ? `
                border-purple-600
                bg-purple-600
                hover:bg-purple-700
                active:bg-purple-800
              `
              : `
                border-orange-500
                bg-orange-500
                hover:bg-orange-600
                active:bg-orange-700
              `
          }
        `}
      >
        {currentLabel}
      </button>

      {/* 月単位・日付単位の操作欄 */}
      <div className="min-w-0 flex-1">
        {isMonth ? (
          <MonthControls
            spaceId={spaceId}
            month={month}
            onMonthChange={onMonthChange}
            disabled={disabled}
            onServiceRecordsUpdated={onServiceRecordsUpdated}
            onDebugResult={setDebugResult}
          />
        ) : (
          <DayControls
            spaceId={spaceId}
            date={date}
            onDateChange={onDateChange}
            disabled={disabled}
            onServiceRecordsUpdated={onServiceRecordsUpdated}
            onDebugResult={setDebugResult}
          />
        )}
      </div>
      </div>

      <div className="mt-3 w-full rounded border border-gray-300 bg-gray-50 p-3">
        <div className="mb-2 text-xs font-bold text-gray-700">
          取得処理デバッグ
        </div>
        <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-all text-xs text-gray-800">
          {debugResult === null
            ? "取得処理はまだ実行されていません。"
            : JSON.stringify(debugResult, null, 2)}
        </pre>
      </div>
    </div>
  );
}
