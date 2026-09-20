// PersonalRecordPage/index.jsx

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import { useAppState } from "@/AppStateContext";
import { useChilledSpace } from "@/hooks/useChilledSpace";
import { useServiceRecord } from "@/hooks/useServiceRecord";
import { setServiceRecord } from "@/store/slices/databaseSlice.js";
import SelectionPanel from './SelectionPanel';

import PersonSwitchPanel, {
  PERIOD_TYPES,
} from "./PersonSwitchPanel";

import ListBox_Text from "./ListBox_Text";

const getFacilityId = (facility) => facility?.facility_id ?? facility?.id ?? null;
const getChildId = (child) => child?.child_id ?? child?.children_id ?? child?.id ?? null;
const getRecordChildId = (record) => record?.children_id ?? record?.child_id ?? null;
const getChildName = (child) => child?.name ?? child?.children_name ?? "";
const isActiveChild = (child) => Number(child?.is_delete ?? 0) !== 1;
const sameId = (left, right) => String(left) === String(right);
const toTable = (value) => (Array.isArray(value) ? value : []);

// =============================================
// 表示タブ
// =============================================
const PANEL_TABS = {
  LIST: "list",
  PERSON_SWITCH: "person-switch",
};

const toMonthStr = (value) => {
  if (!value) return "";

  if (/^\d{4}-\d{2}$/.test(value)) {
    return value;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value.slice(0, 7);
  }

  return "";
};

const toDateStr = (value) => {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  return "";
};

export default function PersonalRecordPage() {
  const {
    CURRENT_YMD,
    FACILITY_ID,
    databaseState,
    setFacilityId,
  } = useAppState();

  const { childId, setChild } = useChilledSpace();

  const dispatch = useDispatch();

  const facilities = toTable(databaseState?.facilitys);
  const allChildren = toTable(databaseState?.children);
  const facilityChildren = toTable(databaseState?.facility_children);

  const facilitiesLoading = false;
  const childrenLoading = false;
  const facilityId = Number(FACILITY_ID);

  const children = useMemo(() => {
    const activeChildren = allChildren.filter(isActiveChild);

    if (!facilityId || facilityChildren.length === 0) {
      return activeChildren;
    }

    const childIdsForFacility = new Set(
      facilityChildren
        .filter((row) => sameId(row?.facility_id, facilityId))
        .map((row) => String(row?.children_id)),
    );

    return activeChildren.filter((child) =>
      childIdsForFacility.has(String(getChildId(child))),
    );
  }, [allChildren, facilityChildren, facilityId]);

  useEffect(() => {
    if ((!facilityId || facilityId <= 0) && facilities.length > 0) {
      setFacilityId(getFacilityId(facilities[0]));
    }
  }, [facilities, facilityId, setFacilityId]);

  useEffect(() => {
    const selectedChild = children.find((child) =>
      sameId(getChildId(child), childId),
    );

    if (selectedChild) {
      return;
    }

    const firstChild = children[0];
    setChild(
      firstChild ? getChildId(firstChild) : "",
      firstChild ? getChildName(firstChild) : "",
    );
  }, [childId, children, setChild]);

  const handleFacilityChange = (value) => {
    setFacilityId(value);
  };

  const handleChildChange = (value) => {
    const selectedChild = children.find((child) =>
      sameId(getChildId(child), value),
    );

    setChild(value, getChildName(selectedChild));
  };

  const {getServiceRecordMonthly,} = useServiceRecord();

  // =============================================
  // 表示タブ
  // =============================================
  const [activeTab, setActiveTab] = useState(
    PANEL_TABS.LIST
  );

  // =============================================
  // ListBox_Text 専用
  //
  // PersonSwitchPanelとは完全に独立
  // =============================================
  const [listMonth, setListMonth] = useState(() =>
    toMonthStr(CURRENT_YMD)
  );

  // =============================================
  // PersonSwitchPanel 専用
  // =============================================
  const [
    personPeriodType,
    setPersonPeriodType,
  ] = useState(PERIOD_TYPES.MONTH);

  const [
    personMonth,
    setPersonMonth,
  ] = useState(() =>
    toMonthStr(CURRENT_YMD)
  );

  const [
    personDate,
    setPersonDate,
  ] = useState(() =>
    toDateStr(CURRENT_YMD)
  );

  // =============================================
  // サービス記録
  // =============================================
  const [
    serviceRecordLoading,
    setServiceRecordLoading,
  ] = useState(false);

  const [
    serviceRecordError,
    setServiceRecordError,
  ] = useState("");

  const [
    serviceRecordReloadSeq,
    setServiceRecordReloadSeq,
  ] = useState(0);

  // =============================================
  // 注意
  //
  // CURRENT_YMD変更時に
  // listMonth / personMonth / personDate を
  // 更新するuseEffectは置かない。
  //
  // これにより初期値だけCURRENT_YMDを使い、
  // その後は完全独立する。
  // =============================================

  const dayOfWeekId = null;

  // =============================================
  // サービス記録再取得
  // =============================================
  const reloadServiceRecords = useCallback(() => {
    setServiceRecordReloadSeq(
      (current) => current + 1
    );
  }, []);

  // =============================================
  // ListBox_Text 用サービス記録取得
  //
  // ★ listMonth だけを見る
  // PersonSwitchPanelの日付は一切参照しない
  // =============================================
  useEffect(() => {
    if (
      !/^\d{4}-\d{2}$/.test(listMonth) ||
      !Number.isInteger(facilityId) ||
      facilityId <= 0 ||
      !childId
    ) {
      dispatch(setServiceRecord([]));
      return;
    }

    let cancelled = false;

    const loadServiceRecords = async () => {
      setServiceRecordLoading(true);
      setServiceRecordError("");

      try {
        const rows =
          await getServiceRecordMonthly({
            target_month: listMonth,
            day_of_week_id: dayOfWeekId,
            facility_id: facilityId,
          });

        const selectedChildRows = rows.filter((record) =>
          sameId(getRecordChildId(record), childId),
        );

        if (!cancelled) {
          dispatch(
            setServiceRecord(selectedChildRows)
          );
        }
      } catch (error) {
        if (!cancelled) {
          console.error(
            "月次サービス記録の取得に失敗しました。",
            error
          );

          dispatch(
            setServiceRecord([])
          );

          setServiceRecordError(
            error?.message ||
              "月次サービス記録の取得に失敗しました。"
          );
        }
      } finally {
        if (!cancelled) {
          setServiceRecordLoading(false);
        }
      }
    };

    loadServiceRecords();

    return () => {
      cancelled = true;
    };
  }, [
    dispatch,
    childId,
    facilityId,
    getServiceRecordMonthly,
    listMonth,
    serviceRecordReloadSeq,
  ]);

  return (
    <div className="w-full">

      {/* =========================================
          ヘッダー
      ========================================= */}
      <div className="bg-slate-100 flex flex-row items-center gap-3 px-2 py-2">

        {/* 児童情報 */}
        <SelectionPanel
          facilities={facilities}
          children={children}
          facilityId={facilityId}
          childId={childId}
          facilitiesLoading={facilitiesLoading}
          childrenLoading={childrenLoading}
          onFacilityChange={handleFacilityChange}
          onChildChange={handleChildChange}
        />

        {/* =====================================
            タブ
        ===================================== */}
        <div
          className="flex rounded-lg border border-gray-300 bg-gray-200 p-1"
          role="tablist"
          aria-label="個人記録表示切替"
        >
          <button
            type="button"
            role="tab"
            aria-selected={
              activeTab === PANEL_TABS.LIST
            }
            onClick={() =>
              setActiveTab(PANEL_TABS.LIST)
            }
            className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${
              activeTab === PANEL_TABS.LIST
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-600 hover:bg-white"
            }`}
          >
            記録一覧
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={
              activeTab ===
              PANEL_TABS.PERSON_SWITCH
            }
            onClick={() =>
              setActiveTab(
                PANEL_TABS.PERSON_SWITCH
              )
            }
            className={`rounded-md px-4 py-1.5 text-sm font-bold transition-colors ${
              activeTab ===
              PANEL_TABS.PERSON_SWITCH
                ? "bg-indigo-600 text-white shadow"
                : "text-gray-600 hover:bg-white"
            }`}
          >
            保存機能
          </button>
        </div>
      </div>

      {/* =========================================
          タブ内容
      ========================================= */}
      <div className="mt-2">

        {/* =====================================
            記録一覧

            ListBox専用の日付管理
        ===================================== */}
        {activeTab === PANEL_TABS.LIST && (
          <div>
            <ListBox_Text
              childId={childId}
              monthStr={listMonth}
              onMonthChange={setListMonth}
            />
          </div>
        )}

        {/* =====================================
            保存機能

            PersonSwitchPanel専用の日付管理
        ===================================== */}
        {activeTab ===
          PANEL_TABS.PERSON_SWITCH && (
          <div className="p-2">
            <PersonSwitchPanel
              value={personPeriodType}
              onChange={
                setPersonPeriodType
              }

              month={personMonth}
              onMonthChange={
                setPersonMonth
              }

              date={personDate}
              onDateChange={
                setPersonDate
              }

              disabled={!childId}

              onServiceRecordsUpdated={
                reloadServiceRecords
              }

              className="border border-gray-100 rounded-md flex bg-gray-400 py-2 px-4 flex-row flex-nowrap items-center gap-3"
            />
          </div>
        )}
      </div>

      {/* =========================================
          読込状態
      ========================================= */}
      {serviceRecordLoading && (
        <p className="mt-1 text-xs text-gray-500">
          サービス記録を取得中です...
        </p>
      )}

      {/* =========================================
          エラー
      ========================================= */}
      {serviceRecordError && (
        <p className="mt-1 text-xs text-red-600">
          {serviceRecordError}
        </p>
      )}
    </div>
  );
}
