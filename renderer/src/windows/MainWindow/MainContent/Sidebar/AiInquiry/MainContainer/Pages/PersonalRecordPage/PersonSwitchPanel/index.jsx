// @/common/hug_function/PersonalRecordManagerPanel2/SwitchPanel/index.jsx
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
    <div
      className={className}
    >
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
            month={month}
            onMonthChange={onMonthChange}
            disabled={disabled}
            onServiceRecordsUpdated={onServiceRecordsUpdated}
          />
        ) : (
          <DayControls
            date={date}
            onDateChange={onDateChange}
            disabled={disabled}
            onServiceRecordsUpdated={onServiceRecordsUpdated}
          />
        )}
      </div>
    </div>
  );
}
