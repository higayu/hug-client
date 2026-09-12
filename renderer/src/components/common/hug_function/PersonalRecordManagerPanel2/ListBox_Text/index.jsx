import React, { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { useAppState } from "@/AppStateContext";
import { selectSpaceChildId } from "@/store/slices/chilledspaceSlice.js";
import { selectServiceRecord } from "@/store/slices/databaseSlice.js";
import { selectPersonalRecordNote } from "./selectPersonalRecordNote";
import CopyButton from "@/components/ui/CopyButton";

/**
 * 指定された月の個人記録一覧を表示し、選択した日付の内容をテキストエリアに表示する
 * 
 * @param {{ monthStr: string, onMonthChange?: (month: string) => void }} props
 */
export default function ListBox_Text({
  spaceId, monthStr = "", onMonthChange }) {
  const { CURRENT_YMD } = useAppState();
  const selectedChildId = useSelector(selectSpaceChildId(spaceId));
  const serviceRecords = useSelector(selectServiceRecord);
  
  // 選択された日付（YYYY-MM-DD）
  const [selectedDate, setSelectedDate] = useState("");
  
  // 選択された日付のnote内容
  const [selectedNote, setSelectedNote] = useState("");
  
  // その月の日付リスト
  const [dateList, setDateList] = useState([]);

  /**
   * YYYY-MM を基準に月を移動
   */
  const shiftMonth = useCallback((yearMonth, amount) => {
    if (!/^\d{4}-\d{2}$/.test(yearMonth)) return "";

    const [year, month] = yearMonth.split("-").map(Number);
    const target = new Date(year, month - 1 + amount, 1);

    return `${target.getFullYear()}-${String(target.getMonth() + 1).padStart(2, "0")}`;
  }, []);

  /**
   * 現在月を YYYY-MM で取得
   */
  const getCurrentMonth = useCallback(() => {
    if (/^\d{4}-\d{2}/.test(CURRENT_YMD || "")) {
      return CURRENT_YMD.slice(0, 7);
    }

    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  }, [CURRENT_YMD]);

  /**
   * 閲覧対象月を変更
   */
  const changeMonth = useCallback((nextMonth) => {
    if (!/^\d{4}-\d{2}$/.test(nextMonth)) return;
    onMonthChange?.(nextMonth);
  }, [onMonthChange]);

  /**
   * 指定された月の日付リストを生成
   */
  const getDaysInMonth = useCallback((yearMonth) => {
    if (!yearMonth || !/^\d{4}-\d{2}$/.test(yearMonth)) return [];
    
    const [year, month] = yearMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push(dateStr);
    }
    
    return days;
  }, []);

  /**
   * 1週間前の日付を取得（YYYY-MM-DD形式）
   */
  const getOneWeekAgo = useCallback(() => {
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    
    const year = oneWeekAgo.getFullYear();
    const month = String(oneWeekAgo.getMonth() + 1).padStart(2, '0');
    const day = String(oneWeekAgo.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
  }, []);

  /**
   * 月が変わったら日付リストを更新
   */
  useEffect(() => {
    if (monthStr) {
      const days = getDaysInMonth(monthStr);
      setDateList(days);
      
      if (days.length > 0) {
        // 1週間前の日付を取得
        const oneWeekAgo = getOneWeekAgo();
        
        // 1週間前の日付がリストに含まれているかチェック
        const targetDate = days.includes(oneWeekAgo) 
          ? oneWeekAgo 
          : days[days.length - 1]; // 含まれていなければ月末を選択
        
        setSelectedDate(targetDate);
      } else {
        setSelectedDate("");
      }
    } else {
      setDateList([]);
      setSelectedDate("");
    }
  }, [monthStr, getDaysInMonth, getOneWeekAgo]);

  /**
   * 選択された日付のnoteを取得
   */
  useEffect(() => {
    if (!selectedChildId || !selectedDate) {
      setSelectedNote("");
      return;
    }

    const note = selectPersonalRecordNote(serviceRecords, {
      childrenId: selectedChildId,
      dateStr: selectedDate,
    });
    
    setSelectedNote(note || "");
  }, [selectedChildId, selectedDate, serviceRecords]);

  /**
   * 日付の表示形式を変換 (YYYY-MM-DD → MM/DD(曜日))
   */
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "";
    const [year, month, day] = dateStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
    return `${parseInt(month)}/${parseInt(day)}(${weekdays[date.getDay()]})`;
  };

  /**
   * その日付にnoteが存在するかチェック
   */
  const hasNote = (dateStr) => {
    if (!selectedChildId) return false;
    const note = selectPersonalRecordNote(serviceRecords, {
      childrenId: selectedChildId,
      dateStr: dateStr,
    });
    return note && note.trim().length > 0;
  };

  return (
    <div className="space-y-3 px-1 py-2 bg-slate-100 rounded-lg">
      {/* 閲覧対象月 */}
      <div className="flex flex-wrap items-center justify-center gap-2 px-2">
        <button
          type="button"
          onClick={() => changeMonth(shiftMonth(monthStr, -1))}
          disabled={!monthStr}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="前月を表示"
        >
          ◀ 前月
        </button>

        <input
          type="month"
          value={monthStr}
          onChange={(e) => changeMonth(e.target.value)}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-bold focus:border-transparent focus:ring-2 focus:ring-amber-500"
          aria-label="閲覧する月"
        />

        <button
          type="button"
          onClick={() => changeMonth(getCurrentMonth())}
          className="rounded border border-indigo-300 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-100"
        >
          今月
        </button>

        <button
          type="button"
          onClick={() => changeMonth(shiftMonth(monthStr, 1))}
          disabled={!monthStr}
          className="rounded border border-gray-300 bg-white px-3 py-2 text-sm font-bold text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="翌月を表示"
        >
          翌月 ▶
        </button>
      </div>

      {/* 日付セレクトボックス */}
      <div className="flex justify-around">
        <select
          className="w-[60%] rounded border border-gray-300 px-3 py-2 bg-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          disabled={dateList.length === 0}
        >
          {dateList.length === 0 ? (
            <option value="">日付がありません</option>
          ) : (
            dateList.map((dateStr) => (
              <option key={dateStr} value={dateStr}>
                {formatDateDisplay(dateStr)}
                {hasNote(dateStr) ? " 📝" : ""}
              </option>
            ))
          )}
        </select>
        {/* 選択中の日付情報 */}
        {selectedDate && (
          <div className="flex shrink-0 items-center justify-center text-xs text-gray-500">
            {hasNote(selectedDate) ? " - 記録あり ✅" : " - 記録なし"}
          </div>
        )}
      </div>

      {/* テキストエリア - 選択された日付の内容を表示 */}
      <div>
        <textarea
          className="h-40 w-full rounded bg-gray-700 p-3 text-white resize-none focus:ring-2 focus:ring-amber-500 focus:outline-none"
          value={selectedNote}
          readOnly
          placeholder={
            !selectedChildId 
              ? "児童が選択されていません" 
              : !selectedDate 
                ? "日付を選択してください"
                : "記録がありません"
          }
        />
        <CopyButton 
          text={selectedNote}
          className='bg-white hover:bg-slate-500 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm shadow-sm active:scale-[0.98]'
          fontStyle='text-black'
          title='個人記録コピー'
         />
      </div>

      {/* 統計情報 */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span>
          📊 合計: {dateList.length}日
        </span>
        <span>
          📝 記録あり: {dateList.filter(d => hasNote(d)).length}日
        </span>
        <span>
          ⬜ 記録なし: {dateList.filter(d => !hasNote(d)).length}日
        </span>
      </div>
    </div>
  );
}
