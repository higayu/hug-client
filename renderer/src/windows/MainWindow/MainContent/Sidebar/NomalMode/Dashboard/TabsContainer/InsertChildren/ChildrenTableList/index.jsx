// renderer/src/components/Sidebar/Tools/InsertManageChildren/ChildrenTableList/index.jsx

import React, { useState, useEffect, useMemo } from "react";
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { useAppState } from "@/AppStateContext";
import ConfirmModal from "./ConfirmModal";
import { insertManager } from "./insertManager";
import { useDataBase } from "@/hooks/useDataBase";
import {
  filterManagers2ByFacilityStaffAndWeekday,
} from "./filterManagers2ByStaffAndWeekday";

/**
 * children_id / id の表記揺れを吸収して number にする
 */
function getChildId(row) {
  const rawId =
    row?.children_id ??
    row?.child_id ??
    row?.id ??
    row?.CHILDREN_ID ??
    row?.CHILD_ID ??
    row?.ID;

  const id = Number(rawId);

  return Number.isFinite(id) ? id : null;
}

/**
 * 表示用 key を作る
 */
function getRowKey(child, index) {
  const cid = getChildId(child);

  return `attendance-${cid ?? "unknown"}-${child?.rowIndex ?? index}`;
}

/**
 * 今日の利用者データを一覧表示するコンポーネント
 */
function ChildrenTableList() {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  const { loadDataBase } = useDataBase();
  const appState = useAppState();

  const { showErrorToast, showSuccessToast } = useToast();

  const {
    STAFF_ID,
    FACILITY_ID,
    CURRENT_DAY_OF_WEEK,
    databaseState,
    setActiveSidebarTab: setActiveTab,
  } = appState;

  const attendanceData =
    appState?.attendanceData ??
    appState?.appState?.attendanceData ??
    (typeof window !== "undefined"
      ? window.AppState?.attendanceData
      : null);

  const currentFacilityId = Number(
    FACILITY_ID ??
      attendanceData?.facilityId ??
      attendanceData?.facility_id
  );

  const currentStaffId = Number(STAFF_ID);
  const currentWeekdayId = Number(CURRENT_DAY_OF_WEEK?.weekdayId);

  const childrenList = useMemo(() => {
    if (!Array.isArray(attendanceData?.data)) {
      return [];
    }

    return attendanceData.data;
  }, [attendanceData]);

  const childrenTableData = Array.isArray(databaseState?.children)
    ? databaseState.children
    : [];

  const managersData = Array.isArray(databaseState?.managers2)
    ? databaseState.managers2
    : [];

  const databaseType =
    appState?.DATABASE_TYPE ??
    appState?.appState?.DATABASE_TYPE ??
    null;

  // =============================================================
  // managers2 から現在施設・現在職員・現在曜日の登録済みデータを抽出
  // =============================================================
  const currentFacilityStaffTodayManagers = useMemo(() => {
    return filterManagers2ByFacilityStaffAndWeekday(
      managersData,
      currentFacilityId,
      currentStaffId,
      currentWeekdayId
    );
  }, [managersData, currentFacilityId, currentStaffId, currentWeekdayId]);

  // =============================================================
  // 登録済み children_id Set
  //
  // ここが次の判定の中心
  // facility_id + staff_id + day_of_week_id で絞った結果から children_id を作る
  // =============================================================
  const registeredChildrenIdSet = useMemo(() => {
    return new Set(
      currentFacilityStaffTodayManagers
        .map((manager) => Number(manager.children_id))
        .filter((id) => Number.isFinite(id))
    );
  }, [currentFacilityStaffTodayManagers]);

  // =============================================================
  // 登録済みになった児童が selectedIds に残らないようにする
  // =============================================================
  useEffect(() => {
    setSelectedIds((prev) =>
      prev.filter((id) => !registeredChildrenIdSet.has(Number(id)))
    );
  }, [registeredChildrenIdSet]);

  // =============================================================
  // ログ確認
  // =============================================================
  useEffect(() => {
    console.log("=== ChildrenTableList / 今日の利用者データ確認 ===");
    console.log("appState.attendanceData:", attendanceData);
    console.log("今日の利用者一覧 childrenList:", childrenList);
    console.log("rowCount:", attendanceData?.rowCount);
    console.log("facilityId:", attendanceData?.facilityId);
    console.log("FACILITY_ID:", FACILITY_ID);
    console.log("currentFacilityId:", currentFacilityId);
    console.log("dateStr:", attendanceData?.dateStr);
    console.log("extractedAt:", attendanceData?.extractedAt);
  }, [attendanceData, childrenList, FACILITY_ID, currentFacilityId]);

  useEffect(() => {
    console.log("=== managers2 現在施設・現在職員・現在曜日 抽出 ===");
    console.log("現在の施設ID:", currentFacilityId);
    console.log("現在の職員ID:", currentStaffId);
    console.log("現在の曜日ID:", currentWeekdayId);
    console.log("児童と職員の紐づけ managers2:", managersData);
    console.log(
      "抽出結果 currentFacilityStaffTodayManagers:",
      currentFacilityStaffTodayManagers
    );
    console.log(
      "登録済み children_id:",
      currentFacilityStaffTodayManagers.map((manager) => manager.children_id)
    );
    console.log("registeredChildrenIdSet:", [...registeredChildrenIdSet]);
  }, [
    currentFacilityId,
    currentStaffId,
    currentWeekdayId,
    managersData,
    currentFacilityStaffTodayManagers,
    registeredChildrenIdSet,
  ]);

  // =============================================================
  // データなし
  // =============================================================
  if (!Array.isArray(childrenList) || childrenList.length === 0) {
    return (
      <div className="border border-orange-500 rounded-2xl px-4 py-2">
        <p className="text-xl text-red-500 mt-4">
          今日の利用者データがありません。
        </p>

        <p className="text-2xl text-red-400 mt-2 font-bold">
          先に HUG から利用者データを取得してください。
        </p>
      </div>
    );
  }

  // =============================================================
  // 個別チェック
  // 登録済み児童は選択不可
  // =============================================================
  const handleCheckboxChange = (id) => {
    const numId = Number(id);

    if (!Number.isFinite(numId)) {
      return;
    }

    if (registeredChildrenIdSet.has(numId)) {
      console.log("登録済みのため選択不可:", numId);
      return;
    }

    setSelectedIds((prev) =>
      prev.includes(numId)
        ? prev.filter((x) => x !== numId)
        : [...prev, numId]
    );
  };

  // =============================================================
  // 全選択
  // 登録済み児童は除外
  // =============================================================
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const ids = childrenList
        .map((child) => getChildId(child))
        .filter((cid) => cid !== null)
        .filter((cid) => !registeredChildrenIdSet.has(cid));

      setSelectedIds([...new Set(ids)]);
    } else {
      setSelectedIds([]);
    }
  };

  // =============================================================
  // 登録（確認モーダル）
  // =============================================================
  const handleConfirm = async (selectedChildren) => {
    if (!databaseType) {
      showErrorToast("API設定が未選択です");
      setShowConfirmModal(false);
      return false;
    }

    if (!Number.isFinite(currentFacilityId)) {
      showErrorToast("施設IDが取得できません");
      setShowConfirmModal(false);
      return false;
    }

    if (!Number.isFinite(currentStaffId)) {
      showErrorToast("職員IDが取得できません");
      setShowConfirmModal(false);
      return false;
    }

    if (!Number.isFinite(currentWeekdayId)) {
      showErrorToast("曜日IDが取得できません");
      setShowConfirmModal(false);
      return false;
    }

    try {
      const result = await insertManager(selectedChildren, {
        childrenData: childrenTableData,
        managersData,
        databaseType,
        FACILITY_ID: currentFacilityId,
        STAFF_ID: currentStaffId,
        CURRENT_DAY_OF_WEEK,
      });

      if (result) {
        showSuccessToast("追加完了しました");

        await loadDataBase({
          reason: "insert-manager/after-success",
        });

        setSelectedIds([]);

        if (typeof setActiveTab === "function") {
          setActiveTab("FanContent");
        }
      } else {
        showErrorToast("失敗しました");
      }

      return result;
    } catch (err) {
      console.error("❌ ChildrenTableList handleConfirm エラー:", err);
      showErrorToast("失敗しました");
      return false;
    } finally {
      setShowConfirmModal(false);
    }
  };

  // =============================================================
  // 選択された児童
  // =============================================================
  const selectedChildren = childrenList.filter((child) => {
    const cid = getChildId(child);

    return (
      cid !== null &&
      selectedIds.includes(cid) &&
      !registeredChildrenIdSet.has(cid)
    );
  });

  const selectableCount = childrenList.filter((child) => {
    const cid = getChildId(child);

    return cid !== null && !registeredChildrenIdSet.has(cid);
  }).length;

  const isAllSelected =
    selectableCount > 0 && selectedIds.length === selectableCount;

  // =============================================================
  // JSX
  // =============================================================
  return (
    <div className="mt-6">
      <div className="mb-3 text-xs text-gray-500">
        <div>取得日: {attendanceData?.dateStr ?? "-"}</div>
        <div>
          施設ID:{" "}
          {Number.isFinite(currentFacilityId) ? currentFacilityId : "-"}
        </div>
        <div>取得件数: {attendanceData?.rowCount ?? childrenList.length}</div>
        <div>取得時刻: {attendanceData?.extractedAt ?? "-"}</div>
        <div>
          現在の職員ID:{" "}
          {Number.isFinite(currentStaffId) ? currentStaffId : "-"}
        </div>
        <div>
          現在の曜日ID:{" "}
          {Number.isFinite(currentWeekdayId) ? currentWeekdayId : "-"}
        </div>
        <div>
          現在施設・職員・曜日の登録数:{" "}
          {currentFacilityStaffTodayManagers.length}
        </div>
      </div>

      <button
        type="button"
        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        onClick={() => {
          if (selectedIds.length === 0) {
            alert("児童を選択してください。");
            return;
          }

          setShowConfirmModal(true);
        }}
      >
        登録
      </button>

      <table className="min-w-full border border-gray-300 text-sm rounded-md overflow-hidden shadow-sm mt-4">
        <thead className="bg-gray-100 text-gray-700">
          <tr>
            <th className="border px-2 py-1">
              <input
                id="select-all"
                type="checkbox"
                checked={isAllSelected}
                disabled={selectableCount === 0}
                onChange={handleSelectAll}
              />
            </th>
            <th className="border px-2 py-1">状態</th>
            <th className="border px-2 py-1">行</th>
            <th className="border px-2 py-1">児童ID</th>
            <th className="border px-2 py-1">児童名</th>
            <th className="border px-2 py-1">入室</th>
            <th className="border px-2 py-1">退室</th>
          </tr>
        </thead>

        <tbody>
          {childrenList.map((child, index) => {
            const cid = getChildId(child);

            if (cid === null) {
              console.warn("⚠️ children_id / id を取得できない行:", child);
              return null;
            }

            const isRegistered = registeredChildrenIdSet.has(cid);
            const isChecked = selectedIds.includes(cid);

            return (
              <tr
                key={getRowKey(child, index)}
                className={`transition-colors ${
                  isRegistered
                    ? "bg-blue-200 text-blue-900 cursor-not-allowed"
                    : "hover:bg-blue-50"
                }`}
              >
                <td className="border px-2 py-1 text-center">
                  <input
                    className={isRegistered ? "hidden" : ""}
                    type="checkbox"
                    checked={isChecked}
                    disabled={isRegistered}
                    onChange={() => handleCheckboxChange(cid)}
                  />
                </td>

                <td className="border px-2 py-1 text-center">
                  {isRegistered ? "登録済み" : "未登録"}
                </td>

                <td className="border px-2 py-1 text-center">
                  {child.rowIndex ?? index + 1}
                </td>

                <td className="border px-2 py-1">{cid}</td>

                <td className="border px-2 py-1">
                  {child.children_name || "-"}
                </td>

                <td className="border px-2 py-1 font-semibold">
                  {child.column5 || "-"}
                </td>

                <td className="border px-2 py-1 text-blue-700 font-semibold">
                  {child.column6 || "-"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <ConfirmModal
        show={showConfirmModal}
        message="以下の児童を登録しますか？"
        list={selectedChildren}
        onConfirm={handleConfirm}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
}

export default ChildrenTableList;