// renderer/src/components/Sidebar/Tools/UpdateManager/Modals/EditModal.jsx

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import SelectableWeekDayButton from "@/components/ui/SelectableWeekDayButton";

import {
  ModalPortal,
} from "@/components/modals/ModalPortal";

import {
  useAppState,
} from "@/AppStateContext";

import {
  formatTimeForInput,
  HALF_HOUR_TIME_OPTIONS,
  validateSupportTimeRange,
} from "../function/supportTimeValidation.js";

const PRIORITY_OPTIONS = [
  {
    value: 0,
    label: "通常",
  },
  {
    value: 1,
    label: "時々対応する",
  },
  {
    value: 2,
    label: "例外的な場合のみ",
  },
];

const createEmptyDaySetting = () => ({
  selected: false,
  originallySelected: false,
  priority: 0,
  support_start_time: "",
  support_end_time: "",
});

export default function EditModal({
  open,
  onClose,
  manager,
  onConfirm,
}) {
  const {
    databaseState,
    FACILITY_ID,
  } = useAppState();

  const [
    daySettings,
    setDaySettings,
  ] = useState({});

  const [
    showUnassignedDays,
    setShowUnassignedDays,
  ] = useState(false);

  const [
    validationError,
    setValidationError,
  ] = useState("");

  // ------------------------------------------
  // 固定表示用
  // ------------------------------------------

  const facilityId = useMemo(() => {
    const rawFacilityId =
      manager?.facility_id ??
      manager?.facilityId ??
      manager?.FACILITY_ID ??
      FACILITY_ID;

    const id = Number(rawFacilityId);

    return Number.isFinite(id)
      ? id
      : "";
  }, [
    manager,
    FACILITY_ID,
  ]);

  const childrenId =
    manager?.children_id ?? "";

  const staffId =
    manager?.staff_id ?? "";

  const childrenName =
    manager?.children_name ?? "";

  const staffName =
    manager?.staff_name ?? "";

  // ------------------------------------------
  // DB
  // ------------------------------------------

  const database = useMemo(() => {
    return databaseState ?? {};
  }, [
    databaseState,
  ]);

  const dayOfWeekMaster =
    useMemo(() => {
      return Array.isArray(
        database.day_of_week
      )
        ? database.day_of_week
        : [];
    }, [
      database.day_of_week,
    ]);

  const managers2 = useMemo(() => {
    return Array.isArray(
      database.managers2
    )
      ? database.managers2
      : [];
  }, [
    database.managers2,
  ]);

  const facilitys = useMemo(() => {
    return Array.isArray(
      database.facilitys
    )
      ? database.facilitys
      : [];
  }, [
    database.facilitys,
  ]);

  const facilityName = useMemo(() => {
    const directName =
      manager?.facility_name ??
      manager?.facilityName ??
      manager?.facility?.name ??
      "";

    if (directName) {
      return directName;
    }

    const targetFacilityId =
      Number(facilityId);

    if (
      !Number.isFinite(
        targetFacilityId
      )
    ) {
      return "";
    }

    const facility = facilitys.find(
      (row) => {
        const id =
          row?.id ??
          row?.facility_id ??
          row?.FACILITY_ID;

        return (
          Number(id) ===
          targetFacilityId
        );
      }
    );

    return (
      facility?.name ??
      facility?.facility_name ??
      facility?.facilityName ??
      facility?.施設名 ??
      ""
    );
  }, [
    manager,
    facilityId,
    facilitys,
  ]);

  // ------------------------------------------
  // 対象施設・児童・スタッフの曜日データ
  // ------------------------------------------

  const targetManagerRows =
    useMemo(() => {
      if (!manager) {
        return [];
      }

      const targetFacilityId =
        Number(facilityId);

      const targetChildrenId =
        Number(
          manager.children_id
        );

      const targetStaffId =
        Number(
          manager.staff_id
        );

      if (
        !Number.isFinite(
          targetFacilityId
        ) ||
        !Number.isFinite(
          targetChildrenId
        ) ||
        !Number.isFinite(
          targetStaffId
        )
      ) {
        console.warn(
          "⚠️ EditModal: targetManagerRows抽出条件が不正です",
          {
            facilityId,
            targetFacilityId,
            children_id:
              manager.children_id,
            targetChildrenId,
            staff_id:
              manager.staff_id,
            targetStaffId,
          }
        );

        return [];
      }

      return managers2.filter(
        (row) =>
          Number(
            row.facility_id
          ) ===
            targetFacilityId &&
          Number(
            row.children_id
          ) ===
            targetChildrenId &&
          Number(
            row.staff_id
          ) ===
            targetStaffId
      );
    }, [
      managers2,
      manager,
      facilityId,
    ]);

  // ------------------------------------------
  // 初期値セット
  // ------------------------------------------

  useEffect(() => {
    if (!manager) {
      return;
    }

    const nextDaySettings = {};

    dayOfWeekMaster.forEach(
      (day) => {
        const dayId =
          Number(day.id);

        const existingRow =
          targetManagerRows.find(
            (row) =>
              Number(
                row.day_of_week_id
              ) === dayId
          );

        const hasManager =
          Boolean(existingRow);

        nextDaySettings[dayId] = {
          selected:
            hasManager,

          originallySelected:
            hasManager,

          priority:
            Number(
              existingRow?.priority ??
              0
            ),

          support_start_time:
            formatTimeForInput(
              existingRow
                ?.support_start_time
            ),

          support_end_time:
            formatTimeForInput(
              existingRow
                ?.support_end_time
            ),
        };
      }
    );

    setDaySettings(
      nextDaySettings
    );

    setShowUnassignedDays(
      false
    );

    setValidationError("");
  }, [
    manager,
    dayOfWeekMaster,
    targetManagerRows,
  ]);

  // ------------------------------------------
  // 表示する曜日
  // ------------------------------------------

  const visibleDayOfWeekMaster =
    useMemo(() => {
      return [
        ...dayOfWeekMaster,
      ]
        .sort(
          (a, b) =>
            Number(
              a.sort_order
            ) -
            Number(
              b.sort_order
            )
        )
        .filter(
          (day) => {
            const dayId =
              Number(day.id);

            const setting =
              daySettings[dayId] ??
              createEmptyDaySetting();

            return (
              showUnassignedDays ||
              setting.selected ||
              setting.originallySelected
            );
          }
        );
    }, [
      dayOfWeekMaster,
      daySettings,
      showUnassignedDays,
    ]);

  const hiddenUnassignedCount =
    useMemo(() => {
      return dayOfWeekMaster.filter(
        (day) => {
          const dayId =
            Number(day.id);

          const setting =
            daySettings[dayId] ??
            createEmptyDaySetting();

          return (
            !setting.selected &&
            !setting.originallySelected
          );
        }
      ).length;
    }, [
      dayOfWeekMaster,
      daySettings,
    ]);

  // ------------------------------------------
  // 曜日トグル
  // ------------------------------------------

  const toggleDay = (id) => {
    const dayId = Number(id);

    setValidationError("");

    setDaySettings(
      (previous) => {
        const current =
          previous[dayId] ??
          createEmptyDaySetting();

        return {
          ...previous,

          [dayId]: {
            ...current,

            selected:
              !current.selected,
          },
        };
      }
    );
  };

  // ------------------------------------------
  // 曜日ごとの値更新
  // ------------------------------------------

  const updateDaySetting = (
    id,
    key,
    value
  ) => {
    const dayId = Number(id);

    setValidationError("");

    setDaySettings(
      (previous) => {
        const current =
          previous[dayId] ??
          createEmptyDaySetting();

        return {
          ...previous,

          [dayId]: {
            ...current,
            [key]: value,
          },
        };
      }
    );
  };

  // ------------------------------------------
  // 保存
  // ------------------------------------------

  const handleSubmit = () => {
    setValidationError("");

    try {
      const targetFacilityId =
        Number(facilityId);

      const targetChildrenId =
        Number(childrenId);

      const targetStaffId =
        Number(staffId);

      if (
        !Number.isFinite(
          targetFacilityId
        ) ||
        !Number.isFinite(
          targetChildrenId
        ) ||
        !Number.isFinite(
          targetStaffId
        )
      ) {
        throw new Error(
          "保存に必要なIDが不足しています。"
        );
      }

      const selectedDayIds =
        Object.entries(
          daySettings
        )
          .filter(
            (
              [
                ,
                setting,
              ]
            ) =>
              setting.selected
          )
          .map(
            ([dayId]) =>
              Number(dayId)
          )
          .filter(
            (dayId) =>
              Number.isFinite(
                dayId
              )
          )
          .sort(
            (a, b) =>
              a - b
          );

      /*
       * 曜日ごとの時刻を
       * モーダル内で事前検証する。
       */
      const validatedTimes =
        new Map();

      for (
        const dayId
        of selectedDayIds
      ) {
        const setting =
          daySettings[dayId] ??
          createEmptyDaySetting();

        const day =
          dayOfWeekMaster.find(
            (row) =>
              Number(row.id) ===
              Number(dayId)
          );

        const dayLabel =
          day?.label_jp ??
          `曜日ID ${dayId}`;

        try {
          const times =
            validateSupportTimeRange({
              support_start_time:
                setting
                  .support_start_time,

              support_end_time:
                setting
                  .support_end_time,
            });

          validatedTimes.set(
            dayId,
            times
          );
        } catch (error) {
          throw new Error(
            `${dayLabel}: ${
              error?.message ??
              "時刻が不正です。"
            }`
          );
        }
      }

      const selectedManagerRows =
        selectedDayIds.map(
          (dayId) => {
            const setting =
              daySettings[dayId] ??
              createEmptyDaySetting();

            const existingRow =
              targetManagerRows.find(
                (row) =>
                  Number(
                    row.day_of_week_id
                  ) ===
                  Number(dayId)
              );

            const times =
              validatedTimes.get(
                dayId
              ) ?? {
                support_start_time:
                  null,

                support_end_time:
                  null,
              };

            return {
              ...existingRow,

              facility_id:
                targetFacilityId,

              children_id:
                targetChildrenId,

              staff_id:
                targetStaffId,

              day_of_week_id:
                Number(dayId),

              priority:
                Number(
                  setting.priority ??
                  0
                ),

              support_start_time:
                times
                  .support_start_time,

              support_end_time:
                times
                  .support_end_time,
            };
          }
        );

      const removedManagerRows =
        targetManagerRows.filter(
          (row) =>
            !selectedDayIds.some(
              (dayId) =>
                Number(dayId) ===
                Number(
                  row.day_of_week_id
                )
            )
        );

      const removedDayOfWeekIds =
        removedManagerRows.map(
          (row) =>
            Number(
              row.day_of_week_id
            )
        );

      const updated = {
        ...manager,

        facility_id:
          targetFacilityId,

        children_id:
          targetChildrenId,

        staff_id:
          targetStaffId,

        children_name:
          childrenName,

        staff_name:
          staffName,

        facility_name:
          facilityName,

        day_of_week_ids:
          selectedDayIds,

        managers2:
          selectedManagerRows,

        removed_day_of_week_ids:
          removedDayOfWeekIds,

        removed_managers2:
          removedManagerRows.map(
            (row) => ({
              ...row,

              facility_id:
                targetFacilityId,

              children_id:
                targetChildrenId,

              staff_id:
                targetStaffId,

              day_of_week_id:
                Number(
                  row.day_of_week_id
                ),
            })
          ),

        original_managers2:
          targetManagerRows.map(
            (row) => ({
              ...row,

              facility_id:
                targetFacilityId,
            })
          ),
      };

      onConfirm(
        updated,
        "edit"
      );
    } catch (error) {
      console.error(
        "[EditModal] validation error:",
        error
      );

      setValidationError(
        error?.message ??
        "入力内容を確認してください。"
      );
    }
  };

  if (!open) {
    return null;
  }

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-xl w-[520px] max-h-[90vh] overflow-y-auto shadow-xl">
          <h2 className="text-lg font-bold mb-4">
            編集
          </h2>

          <div className="flex flex-col gap-3 mt-2">
            <div className="grid grid-cols-1 gap-3">
              <div className="flex flex-col">
                <label className="text-sm font-semibold">
                  施設
                </label>

                <div className="border p-2 rounded-md text-sm bg-gray-100 text-gray-700">
                  {facilityId || "-"}

                  {facilityName
                    ? ` : ${facilityName}`
                    : " : 施設名未取得"}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    子ども
                  </label>

                  <div className="border p-2 rounded-md text-sm bg-gray-100 text-gray-700">
                    {childrenId} : {childrenName}
                  </div>
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold">
                    スタッフ
                  </label>

                  <div className="border p-2 rounded-md text-sm bg-gray-100 text-gray-700">
                    {staffId} : {staffName}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2">
              <label className="text-sm font-semibold">
                曜日ごとの担当設定
              </label>

              {hiddenUnassignedCount > 0 && (
                <button
                  type="button"
                  className="text-xs px-3 py-1 rounded-md border border-gray-300 text-gray-700 bg-gray-50"
                  onClick={() =>
                    setShowUnassignedDays(
                      (previous) =>
                        !previous
                    )
                  }
                >
                  {showUnassignedDays
                    ? "担当なし曜日を隠す"
                    : "担当なし曜日も表示"}
                </button>
              )}
            </div>

            {visibleDayOfWeekMaster.length > 0 ? (
              <div className="flex flex-col gap-3">
                {visibleDayOfWeekMaster.map(
                  (day) => {
                    const dayId =
                      Number(day.id);

                    const setting =
                      daySettings[dayId] ??
                      createEmptyDaySetting();

                    const isRemovePending =
                      setting
                        .originallySelected &&
                      !setting.selected;

                    return (
                      <div
                        key={day.id}
                        className={`border rounded-lg p-3 ${
                          setting.selected
                            ? "bg-blue-50 border-blue-300"
                            : isRemovePending
                              ? "bg-red-50 border-red-300"
                              : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <SelectableWeekDayButton
                            dayId={day.id}
                            label={day.label_jp}
                            active={setting.selected}
                            onClick={() =>
                              toggleDay(
                                day.id
                              )
                            }
                          />

                          <span
                            className={`text-xs ${
                              setting.selected
                                ? "text-blue-600"
                                : isRemovePending
                                  ? "text-red-500"
                                  : "text-gray-500"
                            }`}
                          >
                            {setting.selected
                              ? "担当あり"
                              : isRemovePending
                                ? "削除予定"
                                : "担当なし"}
                          </span>
                        </div>

                        <div className="mt-3 flex flex-col gap-3">
                          <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-gray-600">
                              優先度
                            </label>

                            <select
                              value={
                                setting.priority
                              }
                              disabled={
                                !setting.selected
                              }
                              onChange={(event) =>
                                updateDaySetting(
                                  day.id,
                                  "priority",
                                  Number(
                                    event
                                      .target
                                      .value
                                  )
                                )
                              }
                              className="border p-2 rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400"
                            >
                              {PRIORITY_OPTIONS.map(
                                (option) => (
                                  <option
                                    key={
                                      option.value
                                    }
                                    value={
                                      option.value
                                    }
                                  >
                                    {option.value} : {option.label}
                                  </option>
                                )
                              )}
                            </select>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">
                                支援開始時間
                              </label>

                              <select
                                value={
                                  setting
                                    .support_start_time
                                }
                                disabled={
                                  !setting.selected
                                }
                                onChange={(event) =>
                                  updateDaySetting(
                                    day.id,
                                    "support_start_time",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="border p-2 rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <option value="">
                                  未設定
                                </option>

                                {HALF_HOUR_TIME_OPTIONS.map(
                                  (option) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {option.label}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>

                            <div className="flex flex-col gap-1">
                              <label className="text-xs font-semibold text-gray-600">
                                支援終了時間
                              </label>

                              <select
                                value={
                                  setting
                                    .support_end_time
                                }
                                disabled={
                                  !setting.selected
                                }
                                onChange={(event) =>
                                  updateDaySetting(
                                    day.id,
                                    "support_end_time",
                                    event
                                      .target
                                      .value
                                  )
                                }
                                className="border p-2 rounded-md text-sm disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <option value="">
                                  未設定
                                </option>

                                {HALF_HOUR_TIME_OPTIONS.map(
                                  (option) => (
                                    <option
                                      key={
                                        option.value
                                      }
                                      value={
                                        option.value
                                      }
                                    >
                                      {option.label}
                                    </option>
                                  )
                                )}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400 py-6 text-sm border rounded-md bg-gray-50">
                現在担当している曜日はありません
              </div>
            )}
          </div>

          {validationError && (
            <div
              role="alert"
              className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700"
            >
              {validationError}
            </div>
          )}

          <div className="mt-6 flex gap-3 justify-end">
            <button
              type="button"
              className="px-4 py-2 rounded-md text-sm text-gray-700 border border-gray-300"
              onClick={onClose}
            >
              キャンセル
            </button>

            <button
              type="button"
              className="px-4 py-2 rounded-md text-sm text-white bg-blue-500"
              onClick={handleSubmit}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}