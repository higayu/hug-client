// renderer/src/components/Sidebar/TabsContainer/InsertChildren/index.jsx

import React, { useMemo } from "react";

import ChildrenTableList from "./ChildrenTableList";
import { useAppState } from "@/AppStateContext";

/**
 * 数値IDへ変換する
 */
function toNumberId(value) {
  const id = Number(value);

  return Number.isFinite(id) ? id : null;
}

/**
 * managers2 の行を、現在の職員・現在の曜日に近いものほど優先する
 *
 * managers2 主キー:
 * - children_id
 * - staff_id
 * - day_of_week_id
 */
function getManager2PriorityScore(row, currentStaffId, currentDayOfWeekId) {
  const rowStaffId = toNumberId(row?.staff_id);
  const rowDayOfWeekId = toNumberId(row?.day_of_week_id);

  let score = 0;

  if (
    currentStaffId !== null &&
    rowStaffId !== null &&
    rowStaffId === currentStaffId
  ) {
    score += 10;
  }

  if (
    currentDayOfWeekId !== null &&
    rowDayOfWeekId !== null &&
    rowDayOfWeekId === currentDayOfWeekId
  ) {
    score += 100;
  }

  return score;
}

/**
 * managers2 を children_id ごとに1件へまとめる
 *
 * 重要:
 * managers2 は children_id 単体では重複する。
 * React の key 重複や、同じ児童が複数行表示される問題を避けるため、
 * 表示用 childrenList は children_id ごとに1行へ正規化する。
 */
function buildUniqueChildrenListFromManagers2(
  managers2,
  currentStaffId,
  currentDayOfWeekId
) {
  const map = new Map();

  managers2.forEach((row, index) => {
    const childrenId = toNumberId(row?.children_id);

    if (childrenId === null) {
      console.warn("⚠️ children_id を取得できない managers2 行:", row);
      return;
    }

    const normalizedRow = {
      ...row,
      children_id: childrenId,
      staff_id: toNumberId(row?.staff_id),
      day_of_week_id: toNumberId(row?.day_of_week_id),

      /**
       * ChildrenTableList 側で必要なら使える一意キー
       */
      __managers2_key: `managers2-${row?.children_id}-${row?.staff_id}-${row?.day_of_week_id}-${index}`,
    };

    const existing = map.get(childrenId);

    if (!existing) {
      map.set(childrenId, normalizedRow);
      return;
    }

    const existingScore = getManager2PriorityScore(
      existing,
      currentStaffId,
      currentDayOfWeekId
    );

    const nextScore = getManager2PriorityScore(
      normalizedRow,
      currentStaffId,
      currentDayOfWeekId
    );

    /**
     * 現在の曜日・現在の職員に一致する行を優先して残す
     */
    if (nextScore > existingScore) {
      map.set(childrenId, normalizedRow);
    }
  });

  return Array.from(map.values()).sort((a, b) => {
    return Number(a.children_id) - Number(b.children_id);
  });
}

function InsertChildren() {
  const appState = useAppState();

  const {
    // databaseSlice
    databaseState,

    // AppState
    STAFF_ID,
    CURRENT_DAY_OF_WEEK,
  } = appState;

  const loading = databaseState?.loading ?? false;
  const error = databaseState?.error ?? null;

  const managers2 = Array.isArray(databaseState?.managers2)
    ? databaseState.managers2
    : [];

  const currentStaffId = toNumberId(STAFF_ID);
  const currentDayOfWeekId = toNumberId(CURRENT_DAY_OF_WEEK?.weekdayId);

  const childrenList = useMemo(() => {
    return buildUniqueChildrenListFromManagers2(
      managers2,
      currentStaffId,
      currentDayOfWeekId
    );
  }, [managers2, currentStaffId, currentDayOfWeekId]);

  console.log("児童と職員の紐づけ managers2:", managers2);
  console.log("表示用 childrenList:", childrenList);
  console.log("現在の職員ID:", currentStaffId);
  console.log("現在の曜日ID:", currentDayOfWeekId);

  if (loading) {
    return <p>読み込み中...</p>;
  }

  if (error) {
    return <p>エラー: {String(error)}</p>;
  }

  return (
    <div className="p-4">

      <ChildrenTableList />
    </div>
  );
}

export default InsertChildren;