import { useEffect, useMemo, useState } from "react";

import DeleteModal from "./Modals/DeleteModal.jsx";
import { deleteManager } from "./function/deleteManager/index.js";
import { updateManager } from "./function/updateManager/index.js";
import {
  formatTimeForInput,
  HALF_HOUR_TIME_OPTIONS,
  normalizeTimeForDb,
  validateSupportTimeRange,
} from "./function/supportTimeValidation.js";

import { useToast } from "@/provider/ToastProvider/ToastContext.jsx";
import { useDataBase } from "@/hooks/useDataBase";
import { selectManagersFull } from "./selectManagersFull.js";
import { useAppState } from "@/AppStateContext";

const PRIORITY_OPTIONS = [
  { value: 0, label: "通常" },
  { value: 1, label: "時々対応する" },
  { value: 2, label: "例外的な場合のみ" },
];

const toNumberOrNull = (value) => {
  if (value === "" || value === null || value === undefined) {
    return null;
  }

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const makeManagerKey = ({
  facility_id,
  children_id,
  staff_id,
  day_of_week_id,
}) => {
  const facilityId = toNumberOrNull(facility_id);
  const childrenId = toNumberOrNull(children_id);
  const staffId = toNumberOrNull(staff_id);
  const dayOfWeekId = toNumberOrNull(day_of_week_id);

  if (
    facilityId === null ||
    childrenId === null ||
    staffId === null ||
    dayOfWeekId === null
  ) {
    return null;
  }

  return [facilityId, childrenId, staffId, dayOfWeekId].join("-");
};

const createDraftRow = (manager) => ({
  priority: Number(manager?.priority ?? 0),
  is_active: Number(manager?.is_active ?? 1),
  support_start_time: formatTimeForInput(manager?.support_start_time),
  support_end_time: formatTimeForInput(manager?.support_end_time),
});

const isSameDraft = (manager, draft) => {
  if (!draft) return true;

  return (
    Number(manager?.priority ?? 0) === Number(draft.priority ?? 0) &&
    Number(manager?.is_active ?? 1) === Number(draft.is_active ?? 1) &&
    formatTimeForInput(manager?.support_start_time) ===
      String(draft.support_start_time ?? "") &&
    formatTimeForInput(manager?.support_end_time) ===
      String(draft.support_end_time ?? "")
  );
};

export default function UpdateManagerTable() {
  const { showInfoToast, showErrorToast } = useToast();
  const { loadDataBase } = useDataBase();

  const {
    STAFF_ID,
    FACILITY_ID,
    DATABASE_TYPE,
    appState,
    CURRENT_DAY_OF_WEEK,
    databaseState,
  } = useAppState();

  const rawDatabaseType =
    DATABASE_TYPE ??
    appState?.DATABASE_TYPE ??
    appState?.appState?.DATABASE_TYPE ??
    null;

  const rawFacilityId =
    FACILITY_ID ??
    appState?.FACILITY_ID ??
    appState?.appState?.FACILITY_ID ??
    null;

  const rawStaffId =
    STAFF_ID ??
    appState?.STAFF_ID ??
    appState?.appState?.STAFF_ID ??
    null;

  const currentFacilityId = Number(rawFacilityId);
  const currentStaffId = Number(rawStaffId);

  const database = useMemo(() => databaseState ?? {}, [databaseState]);

  const dayOfWeekMaster = useMemo(
    () => (Array.isArray(database.day_of_week) ? database.day_of_week : []),
    [database.day_of_week]
  );

  const managers = useMemo(() => selectManagersFull(database), [database]);

  const currentFacility = useMemo(() => {
    const facilitys = Array.isArray(databaseState?.facilitys)
      ? databaseState.facilitys
      : [];

    return facilitys.find(
      (facility) => Number(facility.id) === Number(currentFacilityId)
    );
  }, [databaseState?.facilitys, currentFacilityId]);

  const currentFacilityName = currentFacility?.name ?? "-";

  const [activeDayId, setActiveDayId] = useState(null);
  const [draftRows, setDraftRows] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedManager, setSelectedManager] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    if (dayOfWeekMaster.length === 0 || activeDayId !== null) return;

    const today = dayOfWeekMaster.find(
      (day) => Number(day.id) === Number(CURRENT_DAY_OF_WEEK?.weekdayId)
    );

    if (today) {
      setActiveDayId(today.id);
      return;
    }

    const firstDay = [...dayOfWeekMaster].sort(
      (a, b) => Number(a.sort_order) - Number(b.sort_order)
    )[0];

    setActiveDayId(firstDay?.id ?? null);
  }, [dayOfWeekMaster, CURRENT_DAY_OF_WEEK?.weekdayId, activeDayId]);

  // DBを再読込したときだけ、編集用データをDB値で作り直す。
  useEffect(() => {
    const nextDraftRows = {};

    managers.forEach((manager) => {
      const key = makeManagerKey(manager);
      if (!key) return;
      nextDraftRows[key] = createDraftRow(manager);
    });

    setDraftRows(nextDraftRows);
  }, [managers]);

  const targetManagers = useMemo(() => {
    if (!Number.isFinite(currentFacilityId) || !Number.isFinite(currentStaffId)) {
      return [];
    }

    return managers.filter(
      (manager) =>
        Number(manager.facility_id) === Number(currentFacilityId) &&
        Number(manager.staff_id) === Number(currentStaffId)
    );
  }, [managers, currentFacilityId, currentStaffId]);

  const filteredManagers = useMemo(() => {
    if (activeDayId === null) return [];

    return targetManagers
      .filter(
        (manager) => Number(manager.day_of_week_id) === Number(activeDayId)
      )
      .sort((a, b) =>
        String(a.children_name ?? "").localeCompare(
          String(b.children_name ?? ""),
          "ja"
        )
      );
  }, [targetManagers, activeDayId]);

  const dirtyManagers = useMemo(() => {
    return targetManagers.filter((manager) => {
      const key = makeManagerKey(manager);
      return key ? !isSameDraft(manager, draftRows[key]) : false;
    });
  }, [targetManagers, draftRows]);

  const dirtyCount = dirtyManagers.length;

  const updateDraft = (manager, field, value) => {
    const key = makeManagerKey(manager);
    if (!key) return;

    setDraftRows((previous) => ({
      ...previous,
      [key]: {
        ...(previous[key] ?? createDraftRow(manager)),
        [field]: value,
      },
    }));
  };

  const handleResetChanges = () => {
    const nextDraftRows = { ...draftRows };

    targetManagers.forEach((manager) => {
      const key = makeManagerKey(manager);
      if (!key) return;
      nextDraftRows[key] = createDraftRow(manager);
    });

    setDraftRows(nextDraftRows);
  };

  const handleBulkUpdate = async () => {
    if (dirtyManagers.length === 0 || isSaving) return;

    try {
      setIsSaving(true);

      const databaseType = String(rawDatabaseType ?? "")
        .trim()
        .toLowerCase();

      if (!databaseType) {
        throw new Error("DATABASE_TYPEが取得できません。");
      }

      const payloads = dirtyManagers.map((manager) => {
        const key = makeManagerKey(manager);
        const draft = key ? draftRows[key] : null;

        if (!draft) {
          throw new Error("編集データの取得に失敗しました。");
        }

        const validatedTimes = validateSupportTimeRange({
          support_start_time: draft.support_start_time,
          support_end_time: draft.support_end_time,
        });

        return {
          facility_id: Number(manager.facility_id),
          children_id: Number(manager.children_id),
          staff_id: Number(manager.staff_id),
          day_of_week_id: Number(manager.day_of_week_id),
          priority: Number(draft.priority ?? 0),
          is_active: Number(draft.is_active ?? 1),
          support_start_time: normalizeTimeForDb(
            validatedTimes.support_start_time
          ),
          support_end_time: normalizeTimeForDb(validatedTimes.support_end_time),
        };
      });

      for (const payload of payloads) {
        const result = await updateManager(payload, databaseType);

        if (!result) {
          throw new Error(
            `児童ID ${payload.children_id} の更新に失敗しました。`
          );
        }
      }

      showInfoToast(`${payloads.length}件を更新しました。`);
      await loadDataBase();
    } catch (error) {
      console.error("[UpdateManagerTable] bulk update error:", error);
      showErrorToast(error?.message || "一括更新に失敗しました。");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (manager) => {
    setSelectedManager(manager);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async (manager) => {
    try {
      const databaseType = String(rawDatabaseType ?? "")
        .trim()
        .toLowerCase();

      if (!databaseType) {
        throw new Error("DATABASE_TYPEが取得できません。");
      }

      const payload = {
        facility_id: toNumberOrNull(manager?.facility_id ?? currentFacilityId),
        children_id: toNumberOrNull(manager?.children_id),
        staff_id: toNumberOrNull(manager?.staff_id),
        day_of_week_id: toNumberOrNull(manager?.day_of_week_id),
      };

      if (Object.values(payload).some((value) => value === null)) {
        throw new Error("削除に必要なIDが不足しています。");
      }

      const result = await deleteManager(payload, databaseType);

      if (!result) {
        throw new Error("削除に失敗しました。");
      }

      showInfoToast("削除しました。");
      await loadDataBase();
    } catch (error) {
      console.error("[UpdateManagerTable] delete error:", error);
      showErrorToast(error?.message || "削除に失敗しました。");
    } finally {
      setDeleteModalOpen(false);
      setSelectedManager(null);
    }
  };

  return (
    <div className="p-2 bg-white shadow rounded-xl">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold">児童担当編集</h4>
          <div className="mt-1 text-xs text-gray-500">
            <div>
              現在の施設:{" "}
              {Number.isFinite(currentFacilityId)
                ? `（ID: ${currentFacilityId}）${currentFacilityName}`
                : "-"}
            </div>
            <div>
              現在のスタッフID:{" "}
              {Number.isFinite(currentStaffId) ? currentStaffId : "-"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold ${
              dirtyCount > 0 ? "text-amber-600" : "text-gray-400"
            }`}
          >
            変更 {dirtyCount}件
          </span>

          <button
            type="button"
            onClick={handleResetChanges}
            disabled={dirtyCount === 0 || isSaving}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            変更を元に戻す
          </button>

          <button
            type="button"
            onClick={handleBulkUpdate}
            disabled={dirtyCount === 0 || isSaving}
            className="rounded-md bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSaving ? "更新中..." : "変更をまとめて更新"}
          </button>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {[...dayOfWeekMaster]
          .sort((a, b) => Number(a.sort_order) - Number(b.sort_order))
          .map((day) => (
            <button
              key={day.id}
              type="button"
              onClick={() => setActiveDayId(day.id)}
              className={`rounded-full border px-3 py-1 text-sm font-semibold ${
                Number(activeDayId) === Number(day.id)
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-gray-300 bg-gray-100 text-gray-700"
              }`}
            >
              {day.label_jp}
            </button>
          ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border px-3 py-2 text-xs">削除</th>
              <th className="border px-3 py-2 text-xs">childID</th>
              <th className="border px-3 py-2 text-xs">name</th>
              <th className="border px-3 py-2 text-xs">staff</th>
              <th className="border px-3 py-2 text-xs">対応頻度</th>
              <th className="border px-3 py-2 text-xs">有効状態</th>
              <th className="border px-3 py-2 text-xs">支援開始</th>
              <th className="border px-3 py-2 text-xs">支援終了</th>
              <th className="border px-3 py-2 text-xs">状態</th>
            </tr>
          </thead>

          <tbody>
            {filteredManagers.length > 0 ? (
              filteredManagers.map((manager) => {
                const key = makeManagerKey(manager);
                const draft = draftRows[key] ?? createDraftRow(manager);
                const dirty = !isSameDraft(manager, draft);

                return (
                  <tr key={key} className={dirty ? "bg-amber-50" : "bg-white"}>
                    <td className="border px-3 py-2 text-center">
                      <button
                        type="button"
                        className="rounded-md bg-red-500 px-2 py-1 text-xs text-white hover:bg-red-600"
                        onClick={() => handleDelete(manager)}
                        disabled={isSaving}
                      >
                        削除
                      </button>
                    </td>

                    <td className="border px-3 py-2 text-xs">
                      {manager.children_id}
                    </td>

                    <td className="border px-3 py-2 text-xs font-semibold">
                      {manager.children_name}
                    </td>

                    <td className="border px-3 py-2 text-xs">
                      {manager.staff_name}
                    </td>

                    <td className="border px-2 py-2">
                      <select
                        value={draft.priority}
                        onChange={(event) =>
                          updateDraft(
                            manager,
                            "priority",
                            Number(event.target.value)
                          )
                        }
                        disabled={isSaving}
                        className="w-full min-w-36 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs"
                      >
                        {PRIORITY_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border px-2 py-2">
                      <select
                        value={draft.is_active}
                        onChange={(event) =>
                          updateDraft(
                            manager,
                            "is_active",
                            Number(event.target.value)
                          )
                        }
                        disabled={isSaving}
                        className="w-full min-w-24 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value={1}>有効</option>
                        <option value={0}>無効</option>
                      </select>
                    </td>

                    <td className="border px-2 py-2">
                      <select
                        value={draft.support_start_time}
                        onChange={(event) =>
                          updateDraft(
                            manager,
                            "support_start_time",
                            event.target.value
                          )
                        }
                        disabled={isSaving}
                        className="w-full min-w-28 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="">未設定</option>
                        {HALF_HOUR_TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border px-2 py-2">
                      <select
                        value={draft.support_end_time}
                        onChange={(event) =>
                          updateDraft(
                            manager,
                            "support_end_time",
                            event.target.value
                          )
                        }
                        disabled={isSaving}
                        className="w-full min-w-28 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs"
                      >
                        <option value="">未設定</option>
                        {HALF_HOUR_TIME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    <td className="border px-3 py-2 text-center text-xs">
                      {dirty ? (
                        <span className="font-bold text-amber-600">変更あり</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={9}
                  className="py-6 text-center text-sm text-gray-400"
                >
                  この曜日の担当はありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {deleteModalOpen && (
        <DeleteModal
          open={deleteModalOpen}
          mode="delete"
          manager={selectedManager}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedManager(null);
          }}
          onConfirm={handleDeleteConfirm}
        />
      )}
    </div>
  );
}
