import { useEffect } from 'react';
import { useAppState } from '@/AppStateContext';
import { getWeekdayObjectFromDate } from '@/utils/date/dateUtils.js';

export default function SelectedDateWeekday() {
  const { CURRENT_YMD, CURRENT_DAY_OF_WEEK, setCurrentDate } = useAppState();
  const weekday = getWeekdayObjectFromDate(CURRENT_YMD);
  const weekdayId = weekday?.id ?? null;

  // 簡易版では一時メモなどの曜日も選択日付に合わせる。
  useEffect(() => {
    if (weekdayId == null) return;
    if (
      CURRENT_DAY_OF_WEEK?.dateStr !== CURRENT_YMD ||
      CURRENT_DAY_OF_WEEK?.weekdayId !== weekdayId
    ) {
      setCurrentDate({ dateStr: CURRENT_YMD, weekdayId });
    }
  }, [CURRENT_YMD, CURRENT_DAY_OF_WEEK?.dateStr, CURRENT_DAY_OF_WEEK?.weekdayId, weekdayId, setCurrentDate]);

  return (
    <div
      className="shrink-0 rounded bg-sky-100 px-3 py-2 text-sm font-semibold text-sky-900"
      title={weekday ? `${CURRENT_YMD} / 曜日ID: ${weekdayId}` : undefined}
      aria-label="選択日付の曜日"
    >
      {weekday ? `${weekday.label_jp}曜日` : '曜日未取得'}
    </div>
  );
}
