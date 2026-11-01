// src/components/ui/WeekdaySelect.jsx

import React from "react";

import { useAppState } from "@/AppStateContext";
import { useToast } from "@/utils/notifications.jsx";

import {
  DAY_OF_WEEK_MASTER,
} from "@/utils/date/dateUtils.js";

function WeekdaySelect({
  id = "weekdaySelect",
  name = "weekdaySelect",
  className = "",
  onChanged,
}) {
  const { showInfoToast } = useToast();

  const {
    CURRENT_DAY_OF_WEEK,
    setCurrentDate,
  } = useAppState();

  // =============================================================
  // 曜日変更
  // =============================================================
  const handleChange = (e) => {
    const weekdayId = Number(e.target.value);

    const weekdayObj = DAY_OF_WEEK_MASTER.find(
      (w) => w.id === weekdayId
    );

    if (!weekdayObj) {
      console.warn(
        "[WeekdaySelect] 曜日データが見つかりません",
        {
          weekdayId,
        }
      );

      return;
    }

    console.log(
      "[WeekdaySelect] 曜日変更",
      {
        weekdayId: weekdayObj.id,
        weekdayLabel: weekdayObj.label_jp,
      }
    );

    // AppStateの曜日のみ変更
    setCurrentDate({
      weekdayId: weekdayObj.id,
    });

    showInfoToast(
      `📅 曜日を ${weekdayObj.label_jp} に設定しました`
    );

    onChanged?.({
      weekdayId: weekdayObj.id,
      weekdayLabel: weekdayObj.label_jp,
    });
  };

  console.log(
    "[WeekdaySelect] render",
    {
      weekdayId:
        CURRENT_DAY_OF_WEEK.weekdayId,
    }
  );

  return (
    <select
      id={id}
      name={name}
      value={
        CURRENT_DAY_OF_WEEK.weekdayId ?? ""
      }
      onChange={handleChange}
      className={`
        w-full
        p-2
        border
        border-gray-300
        rounded
        text-sm
        bg-white
        text-black
        ${className}
      `}
    >
      {DAY_OF_WEEK_MASTER
        .slice()
        .sort(
          (a, b) =>
            a.sort_order - b.sort_order
        )
        .map((w) => (
          <option
            key={w.id}
            value={w.id}
          >
            {w.label_jp}
          </option>
        ))}
    </select>
  );
}

export default WeekdaySelect;