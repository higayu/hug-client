// src/components/Sidebar/SelectChildrenList/TodayChildrenList/index.jsx
// 子どもリストを表示するコンポーネント

import { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { splitChildrenData } from "@/AppStateContext/splitChildrenData";
import { ELEMENT_IDS } from "@/utils/app/constants.js";
import ChildrenListTabs from "./ChildrenListTabs";
import ChildrenListContent from "./ChildrenListContent";
import { TABS } from "@/components/common/constants";
import { useTodayChildrenListController } from "./useTodayChildrenListController";

export default function TodayChildrenList() {
  const appState = useAppState();

  const {
    // appStateSlice
    SELECT_CHILD,
    SELECT_CHILD_NAME,
    SELECT_CHILD_FILTER_MODE,
    CURRENT_DAY_OF_WEEK,
    STAFF_ID,
    FACILITY_ID,
    childrenData,
    waiting_childrenData,
    Experience_childrenData,
    attendanceData,

    // databaseSlice
    databaseState,

    // actions
    updateAppState,
    setSelectedChild,
    setSelectedPcName,
  } = appState;

  const [activeTab, setActiveTab] = useState(TABS.NORMAL);
  const [doneChildIds, setDoneChildIds] = useState([]);

  // STAFF_IDが設定されているか
  const hasStaffId =
    STAFF_ID !== null &&
    STAFF_ID !== undefined &&
    String(STAFF_ID).trim() !== "";

  // ==============================
  // 曜日ID
  // ==============================
  const weekdayId = useMemo(() => {
    return CURRENT_DAY_OF_WEEK?.weekdayId ?? null;
  }, [CURRENT_DAY_OF_WEEK]);

  // ==============================
  // 表示用の児童データ
  // ChildrenListContentへ渡す元データ
  // ==============================
  const [displayChildrenData, setDisplayChildrenData] = useState(() =>
    Array.isArray(childrenData) ? childrenData : []
  );

  const [displayWaitingChildrenData, setDisplayWaitingChildrenData] =
    useState(() =>
      Array.isArray(waiting_childrenData)
        ? waiting_childrenData
        : []
    );

  const [
    displayExperienceChildrenData,
    setDisplayExperienceChildrenData,
  ] = useState(() =>
    Array.isArray(Experience_childrenData)
      ? Experience_childrenData
      : []
  );

  // ==============================
  // 曜日・職員・施設変更時
  // ==============================
  useEffect(() => {
    let cancelled = false;

    const clearChildrenData = () => {
      const emptyChildrenData = {
        childrenData: [],
        waiting_childrenData: [],
        Experience_childrenData: [],
      };

      setDisplayChildrenData([]);
      setDisplayWaitingChildrenData([]);
      setDisplayExperienceChildrenData([]);

      updateAppState?.(emptyChildrenData);

      if (window.AppState) {
        window.AppState.childrenData = [];
        window.AppState.waiting_childrenData = [];
        window.AppState.Experience_childrenData = [];
      }
    };

    async function refreshChildrenByDayOfWeek() {
      /*
       * STAFF_IDが未設定の場合は、
       * 前に選択していた職員の児童一覧を残さない
       */
      if (!hasStaffId) {
        console.warn(
          "[TodayChildrenList] STAFF_IDが未設定のため児童リスト更新をスキップ"
        );

        clearChildrenData();
        return;
      }

      if (!databaseState) {
        console.warn(
          "[TodayChildrenList] databaseStateが空のため児童リスト更新をスキップ"
        );
        return;
      }

      if (weekdayId == null) {
        console.warn(
          "[TodayChildrenList] weekdayIdが空のため児童リスト更新をスキップ"
        );
        return;
      }

      try {
        // ==============================
        // 1. 古いAppStateの児童データを削除
        // ==============================
        clearChildrenData();

        console.log("[TodayChildrenList] 古い児童データを削除", {
          staffId: STAFF_ID,
          facilityId: FACILITY_ID,
          weekdayId,
          previousChildrenDataCount: Array.isArray(childrenData)
            ? childrenData.length
            : "not array",
          previousWaitingChildrenDataCount: Array.isArray(
            waiting_childrenData
          )
            ? waiting_childrenData.length
            : "not array",
          previousExperienceChildrenDataCount: Array.isArray(
            Experience_childrenData
          )
            ? Experience_childrenData.length
            : "not array",
        });

        // ==============================
        // 2. 新しい曜日・職員の児童データを取得
        // ==============================
        const result = await splitChildrenData({
          tables: databaseState,
          staffId: STAFF_ID,
          weekdayId,
          facility_id: FACILITY_ID,
        });

        if (cancelled) {
          return;
        }

        const nextChildrenData = Array.isArray(
          result?.week_children
        )
          ? result.week_children
          : [];

        const nextWaitingChildrenData = Array.isArray(
          result?.waiting_children
        )
          ? result.waiting_children
          : [];

        const nextExperienceChildrenData = Array.isArray(
          result?.Experience_children
        )
          ? result.Experience_children
          : [];

        // ==============================
        // 3. 表示用stateを更新
        // ==============================
        setDisplayChildrenData(nextChildrenData);
        setDisplayWaitingChildrenData(nextWaitingChildrenData);
        setDisplayExperienceChildrenData(
          nextExperienceChildrenData
        );

        // ==============================
        // 4. AppState側も新しい値に更新
        // ==============================
        updateAppState?.({
          childrenData: nextChildrenData,
          waiting_childrenData: nextWaitingChildrenData,
          Experience_childrenData:
            nextExperienceChildrenData,
        });

        if (window.AppState) {
          window.AppState.childrenData = nextChildrenData;
          window.AppState.waiting_childrenData =
            nextWaitingChildrenData;
          window.AppState.Experience_childrenData =
            nextExperienceChildrenData;
        }

        console.log(
          "[TodayChildrenList] 職員・曜日変更後の児童データを反映",
          {
            staffId: STAFF_ID,
            facilityId: FACILITY_ID,
            weekdayId,
            childrenDataCount: nextChildrenData.length,
            waitingChildrenDataCount:
              nextWaitingChildrenData.length,
            experienceChildrenDataCount:
              nextExperienceChildrenData.length,
          }
        );

        console.table(
          nextChildrenData.map((child) => ({
            children_id: child?.children_id,
            children_name: child?.children_name,
            priority: child?.priority,
            pc_name: child?.pc_name,
            support_start_time: child?.support_start_time,
            support_end_time: child?.support_end_time,
          }))
        );
      } catch (error) {
        console.error(
          "[TodayChildrenList] 児童リスト更新に失敗:",
          error
        );
      }
    }

    refreshChildrenByDayOfWeek();

    return () => {
      cancelled = true;
    };
  }, [
    hasStaffId,
    STAFF_ID,
    FACILITY_ID,
    weekdayId,
    databaseState,
    updateAppState,
  ]);

  const {
    normalChildren,
    sometimesChildren,
    temporaryChildren,
    visibleWaitingChildren,
    visibleExperienceChildren,

    handleChildSelect,
    handleToggleDone,
    getChildNotesTitle,
    getChildAbsent,
    getChildExited,
  } = useTodayChildrenListController({
    SELECT_CHILD,
    SELECT_CHILD_FILTER_MODE,

    childrenData: displayChildrenData,
    waiting_childrenData: displayWaitingChildrenData,
    Experience_childrenData:
      displayExperienceChildrenData,

    attendanceData,
    activeTab,
    setDoneChildIds,
    setSelectedChild,
    setSelectedPcName,
  });

  // ==============================
  // ChildrenListContentに渡る直前の確認ログ
  // ==============================
  useEffect(() => {
    console.log(
      "[TodayChildrenList] ChildrenListContentへ渡す値",
      {
        activeTab,
        staffId: STAFF_ID,
        hasStaffId,
        SELECT_CHILD,
        SELECT_CHILD_NAME,
        weekdayId,
        displayChildrenDataCount:
          displayChildrenData.length,
        normalChildrenCount: normalChildren.length,
        sometimesChildrenCount:
          sometimesChildren.length,
        temporaryChildrenCount:
          temporaryChildren.length,
        waitingChildrenCount:
          visibleWaitingChildren.length,
        experienceChildrenCount:
          visibleExperienceChildren.length,
      }
    );
  }, [
    activeTab,
    STAFF_ID,
    hasStaffId,
    SELECT_CHILD,
    SELECT_CHILD_NAME,
    weekdayId,
    displayChildrenData,
    normalChildren,
    sometimesChildren,
    temporaryChildren,
    visibleWaitingChildren,
    visibleExperienceChildren,
  ]);

  return (
    <div className="sidebar-content flex-1 overflow-y-auto px-2 py-1">
      {!hasStaffId ? (
        <div
          role="alert"
          className="
            flex min-h-20 items-center justify-center
            rounded-lg border border-amber-700
            bg-amber-50 px-3 py-4
            text-center text-2xl font-bold text-red-700
          "
        >
          職員を設定してください
        </div>
      ) : (
        <>
          <ChildrenListTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
          />

          <ul
            id={ELEMENT_IDS.CHILDREN_LIST}
            className="m-0 list-none p-0"
          >
            <ChildrenListContent
              activeTab={activeTab}
              normalChildren={normalChildren}
              sometimesChildren={sometimesChildren}
              temporaryChildren={temporaryChildren}
              waitingChildrenData={
                visibleWaitingChildren
              }
              experienceChildrenData={
                visibleExperienceChildren
              }
              selectedChildId={SELECT_CHILD}
              onSelectChild={handleChildSelect}
              getChildNotesTitle={getChildNotesTitle}
              doneChildIds={doneChildIds}
              onToggleDone={handleToggleDone}
              getChildAbsent={getChildAbsent}
              getChildExited={getChildExited}
            />
          </ul>
        </>
      )}
    </div>
  );
}