import React, { useState } from "react";
import {FaRobot, FaPowerOff, FaSyncAlt, FaBolt, FaChild, FaBaby, FaBabyCarriage, FaSchool } from "react-icons/fa";

import { useAppState } from "@/AppStateContext";
import { useAttendanceFetch } from "./useAttendanceFetch";
import SelectChildFilter from './SelectChildFilter';

function formatLastFetchedAt(extractedAt) {
  if (!extractedAt) {
    return {
      dateTime: "未取得",
      time: "未取得",
    };
  }

  const date = new Date(extractedAt);

  if (Number.isNaN(date.getTime())) {
    return {
      dateTime: "未取得",
      time: "未取得",
    };
  }

  return {
    dateTime: date.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
    time: date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }),
  };
}

/**
 * 利用者データ取得 UI
 *
 * - 自動取得トグル
 * - 手動取得ボタン
 * - 最終取得日時表示
 *
 * 取得処理はこのコンポーネント内部で実行する
 */
export default function GetTodayUsersChildren({HideFlg= false}) {

  const { attendanceData } = useAppState();

  const { runFetch, autoFetchEnabled, toggleAutoFetch } = useAttendanceFetch("GetTodayUsersChildren");

  const lastFetchedAt = attendanceData?.extractedAt ?? null;
  const fetchedAtLabel = formatLastFetchedAt(lastFetchedAt);

  return (
    <div className="flex flex-row gap-1 py-1 px-2 items-center justify-center">

      <div className="flex flex-col gap-2 items-center justify-center">
        <button
          type="button"
          title="自動取得"
          className={
            autoFetchEnabled
              ? "btn-purple hover:bg-purple-600 p-2 rounded text-white text-xs shrink-0 flex items-center gap-1"
              : "bg-gray-400 hover:bg-gray-500 p-2 rounded text-white text-xs shrink-0 flex items-center gap-1"
          }
          onClick={toggleAutoFetch}
        >
          {autoFetchEnabled ? <FaRobot size={14} /> : <FaPowerOff size={14} />}
          Auto
        </button>

        <div className="flex items-center justify-center">
          <div
            className="relative"
          >
            <button
              type="button"
              onClick={() => runFetch()}
              title="今日の利用者のデータ取得"
              className="flex items-center justify-center px-7 py-2 gap-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-md"
            >
              <FaChild size={16} />
            </button>
          </div>
        </div>
      </div>

    
      {!HideFlg && (
        <div className="flex flex-col gap-2 items-center justify-center">
          <div
            className="border border-gray-300 rounded-md bg-white py-1 px-2 flex flex-row gap-2 items-center text-center"
            title={fetchedAtLabel.dateTime}
          >
            <span className="text-sm font-bold text-gray-900">取得：</span>
            <span
              className={`text-xl font-extrabold ${
                lastFetchedAt ? "text-green-800" : "text-red-700"
              }`}
            >
              {fetchedAtLabel.time}
            </span>
          </div>

          <SelectChildFilter />
        </div>
      )}

    </div>
  );
}