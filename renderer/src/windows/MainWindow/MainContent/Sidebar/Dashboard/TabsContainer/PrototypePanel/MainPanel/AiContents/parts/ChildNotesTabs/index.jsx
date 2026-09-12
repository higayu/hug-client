// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/parts/ChildNotesTabs/index.jsx

import React, { useEffect, useMemo, useState } from "react";
import { useAppState } from "@/AppStateContext";
import { useSelector } from "react-redux";
import { selectSpaceChildId } from "@/store/slices/chilledspaceSlice.js";
import ChildNotes from "./ChildNotes";
import PersonSupportPlan from "@/components/common/hug_function/PersonSupportPlan";

const DBG = "ChildNotesTabs";

const NOTE_TABS = [
  {
    key: "notes2",
    label: "個別支援計画",
  },
  {
    key: "notes",
    label: "専門支援内容",
  },
  {
    key: "notes3",
    label: "メモ3",
  },
];

export default function ChildNotesTabs({
  spaceId,
  className = "",
  emptyText = "メモがありません",
  onNotesChange = null,
  children = null,
  defaultTab = "notes",
}) {
  const appState = useAppState();

  const selectedChildId = useSelector(selectSpaceChildId(spaceId));

  const {
    childrenData,
    waiting_childrenData,
    Experience_childrenData,
  } = appState;

  const [activeTab, setActiveTab] = useState(defaultTab);

  // =============================================================
  // databaseState.children
  // =============================================================
  const databaseChildren = useMemo(
    () =>
      Array.isArray(appState?.databaseState?.children)
        ? appState.databaseState.children
        : [],
    [appState?.databaseState?.children]
  );

  // =============================================================
  // 既存データ
  // =============================================================
  const weekChildrenData = useMemo(
    () => (Array.isArray(childrenData) ? childrenData : []),
    [childrenData]
  );

  const waitingChildrenData = useMemo(
    () =>
      Array.isArray(waiting_childrenData)
        ? waiting_childrenData
        : [],
    [waiting_childrenData]
  );

  const experienceChildrenData = useMemo(
    () =>
      Array.isArray(Experience_childrenData)
        ? Experience_childrenData
        : [],
    [Experience_childrenData]
  );

  // =============================================================
  // 選択中児童取得
  // =============================================================
  const selectedChild = useMemo(() => {
    if (!selectedChildId) {
      return null;
    }

    const selectedId = String(selectedChildId);

    const childFromDatabase = databaseChildren.find(
      (child) =>
        String(child?.id ?? child?.children_id) === selectedId
    );

    if (childFromDatabase) {
      return childFromDatabase;
    }

    return (
      weekChildrenData.find(
        (child) =>
          String(child?.id ?? child?.children_id) === selectedId
      ) ||
      waitingChildrenData.find(
        (child) =>
          String(child?.id ?? child?.children_id) === selectedId
      ) ||
      experienceChildrenData.find(
        (child) =>
          String(child?.id ?? child?.children_id) === selectedId
      ) ||
      null
    );
  }, [
    selectedChildId,
    databaseChildren,
    weekChildrenData,
    waitingChildrenData,
    experienceChildrenData,
  ]);

  // =============================================================
  // 現在タブのメモ
  // =============================================================
  const activeNotes = useMemo(() => {
    if (!selectedChild) {
      return "";
    }

    const value = selectedChild?.[activeTab];

    return typeof value === "string"
      ? value
      : "";
  }, [
    selectedChild,
    activeTab,
  ]);

  // =============================================================
  // 親へ通知
  // =============================================================
  useEffect(() => {
    if (typeof onNotesChange === "function") {
      onNotesChange(
        activeNotes,
        activeTab,
        selectedChild
      );
    }
  }, [
    activeNotes,
    activeTab,
    selectedChild,
    onNotesChange,
  ]);

  // =============================================================
  // DEBUG
  // =============================================================
  useEffect(() => {
    console.log(`[${DBG}]`, {
      selectedChildId,
      activeTab,
      found: Boolean(selectedChild),
      childId:
        selectedChild?.id ??
        selectedChild?.children_id ??
        null,
      childName:
        selectedChild?.name ??
        null,
      notesLength:
        activeNotes.length,
    });
  }, [
    selectedChildId,
    activeTab,
    selectedChild,
    activeNotes,
  ]);

  return (
    <div className={className}>

      {/* =====================================================
          ヘッダー
      ===================================================== */}
      <div className="flex flex-row justify-between items-center mb-2">
        <h4 className="text-xs text-gray-700">
          DB保存済み内容

          <span className="font-bold ml-1">
            {selectedChildId ?? "未選択"}
          </span>
        </h4>

        <div className="flex items-center gap-2">
          {activeTab === "notes2" && <PersonSupportPlan spaceId={spaceId} />}
          {children}
        </div>
      </div>

      {/* =====================================================
          タブ
      ===================================================== */}
      <div className="flex flex-row gap-1 mb-2">
        {NOTE_TABS.map((tab) => {
          const isActive =
            activeTab === tab.key;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTab(tab.key);
              }}
              className={`
                px-3
                py-1.5
                text-xs
                rounded-t
                border
                transition-colors
                ${
                  isActive
                    ? "bg-gray-700 text-white border-gray-700"
                    : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
                }
              `}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* =====================================================
          メモ表示
      ===================================================== */}
      <ChildNotes
        notes={activeNotes}
        emptyText={emptyText}
      />

    </div>
  );
}
