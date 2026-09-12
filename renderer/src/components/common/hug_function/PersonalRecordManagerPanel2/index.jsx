// PersonalRecordManagerPanel2/index.jsx

import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { selectSpaceChildId } from "@/store/slices/chilledspaceSlice.js";

import { useAppState } from "@/AppStateContext";
import { useServiceRecord } from "@/hooks/useServiceRecord";
import { setServiceRecord } from "@/store/slices/databaseSlice.js";

import PersonSwitchPanel, {
  PERIOD_TYPES,
} from "./PersonSwitchPanel";

import ListBox_Text from "./ListBox_Text";

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

export default function PersonalRecordManagerPanel2({ spaceId }) {
  const {
    CURRENT_YMD,
    FACILITY_ID,
  } = useAppState();
  const selectedChildId = useSelector(selectSpaceChildId(spaceId));

  const dispatch = useDispatch();

  const {
    getServiceRecordMonthly,
  } = useServiceRecord();

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

  const facilityId = Number(FACILITY_ID);

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
      facilityId <= 0
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

        if (!cancelled) {
          dispatch(
            setServiceRecord(rows)
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
        <div className="flex shrink-0 items-center justify-center">
          {selectedChildId ? (
            <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
              👤 児童ID: {selectedChildId}
            </span>
          ) : (
            <p className="m-0 whitespace-nowrap text-sm text-red-500 font-bold">
              Not Select
            </p>
          )}
        </div>

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
              spaceId={spaceId}
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
              spaceId={spaceId}
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

              disabled={!selectedChildId}

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