import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "@/AppStateContext";
import { useSelector } from "react-redux";
import { updateManager, getManagerRecord } from "./managersUtils.js";
import { ModalPortal } from "@/components/modals/ModalPortal";

/**
 * select の HH:mm を DB保存用の HH:mm:ss に変換する
 *
 * 例:
 * - "09:00" → "09:00:00"
 * - "09:30" → "09:30:00"
 * - ""      → null
 */
function selectTimeToDbTime(value) {
  if (value === "" || value == null) {
    return null;
  }

  const match = String(value).match(/^(\d{1,2}):(00|30)$/);

  if (!match) {
    return null;
  }

  const hour = Number(match[1]);

  if (hour < 0 || hour > 23) {
    return null;
  }

  return `${String(hour).padStart(2, "0")}:${match[2]}:00`;
}

/**
 * DBから来た TIME / TEXT を select 用の HH:mm に変換する
 *
 * 例:
 * - "09:00:00" → "09:00"
 * - "09:30:00" → "09:30"
 * - null        → ""
 */
function dbTimeToSelectValue(time) {
  if (!time) {
    return "";
  }

  const text = String(time).trim();

  if (!text) {
    return "";
  }

  const colonMatch = text.match(/^(\d{1,2}):(\d{2})/);

  if (colonMatch) {
    const hour = Number(colonMatch[1]);
    const minute = Number(colonMatch[2]);

    if (hour < 0 || hour > 23 || ![0, 30].includes(minute)) {
      return "";
    }

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  const digits = text.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const normalized = digits.padStart(4, "0");
  const hour = Number(normalized.slice(0, 2));
  const minute = Number(normalized.slice(2, 4));

  if (hour < 0 || hour > 23 || ![0, 30].includes(minute)) {
    return "";
  }

  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/**
 * select value 用に文字列へ統一する
 */
function toSelectValue(value) {
  if (value === undefined || value === null) {
    return "";
  }

  return String(value);
}

/**
 * 施設IDを取得する
 */
function getFacilityId(row) {
  return row?.id ?? row?.facility_id ?? row?.FacilityID ?? "";
}

/**
 * 施設名を取得する
 */
function getFacilityName(row) {
  return row?.name ?? row?.facility_name ?? row?.FacilityName ?? "";
}

/**
 * 00:00〜23:30の30分刻みの選択肢
 */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hour = Math.floor(index / 2);
  const minute = index % 2 === 0 ? "00" : "30";
  const value = `${String(hour).padStart(2, "0")}:${minute}`;

  return {
    value,
    label: value,
  };
});

/**
 * 確認モーダルコンポーネント
 */
function ConfirmModal({ show, message, list = [], onConfirm, onCancel }) {
  const database = useSelector((state) => state.database);

  const pronunciation = database?.pronunciation ?? [];
  const childrenType = database?.children_type ?? [];
  const childrenData = database?.children ?? [];
  const managersList = database?.managers ?? [];

  const { STAFF_ID, FACILITY_ID, CURRENT_DAY_OF_WEEK, appState } =
    useAppState();

  const weekdayId = CURRENT_DAY_OF_WEEK?.weekdayId;

  /**
   * 施設一覧
   * appState.facilitys 優先。
   * 念のため Redux database.facilitys にも対応。
   */
  const facilityOptions = Array.isArray(appState?.facilitys)
    ? appState.facilitys
    : Array.isArray(database?.facilitys)
      ? database.facilitys
      : [];

  const [selectedValues, setSelectedValues] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // モーダルを開いている間、初期値で選択値を上書きし続けないための ref
  const initializedForOpenRef = useRef(false);

  useEffect(() => {
    console.log("職員ID", STAFF_ID);
    console.log("施設ID 初期値 FACILITY_ID", FACILITY_ID);
    console.log("曜日ID", weekdayId);
    console.log("day_of_week マスタ", database?.day_of_week);
    console.log("facilitys データ", facilityOptions);
    console.log("managers データ", database?.managers);
    console.log("managers2 データ", database?.managers2);
  }, [database, STAFF_ID, FACILITY_ID, weekdayId, facilityOptions]);

  /**
   * モーダルを開いたとき、list の既存値から初期値を作る
   *
   * 重要:
   * - FACILITY_ID は施設セレクトの初期値としてのみ使う
   * - セレクト変更後は selectedValues[id].facility_id を優先する
   * - show=false になったら初期化フラグを戻す
   * - show=true 中はユーザーが選択した値を useEffect で上書きしない
   * - selectedValues のキーは String(children_id) に統一
   */
  useEffect(() => {
    if (!show) {
      initializedForOpenRef.current = false;
      setSelectedValues({});
      setSubmitError("");
      setIsSubmitting(false);
      return;
    }

    if (initializedForOpenRef.current) {
      return;
    }

    if (!Array.isArray(list) || list.length === 0) {
      initializedForOpenRef.current = true;
      setSelectedValues({});
      return;
    }

    const initialValues = {};

    list.forEach((child) => {
      const id = String(child.children_id);

      initialValues[id] = {
        pronunciation_id: toSelectValue(child.pronunciation_id),
        children_type_id: toSelectValue(child.children_type_id),

        // FACILITY_ID は初期値としてのみ使用
        facility_id: toSelectValue(FACILITY_ID),

        support_start_time: dbTimeToSelectValue(child.support_start_time),
        support_end_time: dbTimeToSelectValue(child.support_end_time),
      };
    });

    console.log("🧩 ConfirmModal 初期 selectedValues:", initialValues);

    initializedForOpenRef.current = true;
    setSelectedValues(initialValues);
  }, [show, list, FACILITY_ID]);

  if (!show) return null;

  const handleSelectChange = (childrenId, key, value) => {
    const id = String(childrenId);

    console.log("🔁 select変更:", {
      childrenId,
      id,
      key,
      value,
    });

    setSubmitError("");
    setSelectedValues((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] ?? {}),
        [key]: value,
      },
    }));
  };

  /**
   * 施設ID取得
   *
   * - セレクト変更済みなら selected.facility_id を優先
   * - 未変更なら初期値 FACILITY_ID
   * - 空欄を選んだ場合は "" のまま扱う
   */
  const resolveSelectedFacilityId = (selected) => {
    if (selected && Object.prototype.hasOwnProperty.call(selected, "facility_id")) {
      return toSelectValue(selected.facility_id);
    }

    return toSelectValue(FACILITY_ID);
  };

  /**
   * 新仕様 managers2 用に、
   * children_id + facility_id + staff_id で既存担当を探す。
   *
   * 旧 getManagerRecord との互換のため、見つからない場合は既存関数も使う。
   */
  const findManagerRecord = (childrenId, facilityId) => {
    const foundByNewKey = managersList.find((manager) => {
      const sameChild = String(manager.children_id) === String(childrenId);

      const sameFacility =
        manager.facility_id === undefined ||
        manager.facility_id === null ||
        String(manager.facility_id) === String(facilityId);

      const sameStaff = String(manager.staff_id) === String(STAFF_ID);

      return sameChild && sameFacility && sameStaff;
    });

    if (foundByNewKey) {
      return foundByNewKey;
    }

    return getManagerRecord(childrenId, STAFF_ID, managersList);
  };

  const handleConfirm = async () => {
    if (isSubmitting) return;

    setSubmitError("");
    if (!weekdayId) {
      console.error("❌ weekdayId が未設定です");
      window.alert("曜日が未設定です。");
      return;
    }

    const missingFacility = list.find((child) => {
      const id = String(child.children_id);
      const selected = selectedValues[id] ?? {};
      const facilityId = resolveSelectedFacilityId(selected);

      return !facilityId;
    });

    if (missingFacility) {
      console.error("❌ facility_id が未設定です", missingFacility);
      window.alert("施設を選択してください。");
      return;
    }

    const invalidTimeChild = list.find((child) => {
      const selected = selectedValues[String(child.children_id)] ?? {};
      const startTime = selectTimeToDbTime(selected.support_start_time);
      const endTime = selectTimeToDbTime(selected.support_end_time);

      return startTime !== null && endTime !== null && startTime >= endTime;
    });

    if (invalidTimeChild) {
      setSubmitError(
        `${invalidTimeChild.children_name ?? `ID: ${invalidTimeChild.children_id}`} の支援終了時間は、支援開始時間より後にしてください。`,
      );
      return;
    }

    const updatedList = list.map((child) => {
      const id = String(child.children_id);
      const selected = selectedValues[id] ?? {};

      // セレクト変更済みならそれを優先、未変更なら FACILITY_ID
      const selectedFacilityId = resolveSelectedFacilityId(selected);

      const existingChild = childrenData.find(
        (c) => String(c.id) === String(child.children_id)
      );

      const managerRecord = findManagerRecord(
        child.children_id,
        selectedFacilityId
      );

      const updatedDayJson = updateManager(
        managerRecord?.day_of_week,
        weekdayId
      );

      const supportStartTime = selectTimeToDbTime(selected.support_start_time);
      const supportEndTime = selectTimeToDbTime(selected.support_end_time);

      return {
        ...child,

        // managers2 新仕様用
        facility_id: selectedFacilityId,

        pronunciation_id:
          existingChild?.pronunciation_id ??
          selected.pronunciation_id ??
          null,

        children_type_id:
          existingChild?.children_type_id ??
          selected.children_type_id ??
          null,

        // managers 旧仕様用
        day_of_week: updatedDayJson,

        // managers2 新仕様用
        support_start_time: supportStartTime,
        support_end_time: supportEndTime,
      };
    });

    console.log("送信データ(updatedList):", updatedList);
    setIsSubmitting(true);
    try {
      const succeeded = await onConfirm(updatedList);
      if (!succeeded) {
        setSubmitError("登録に失敗しました。入力内容を確認して再度送信してください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white text-black rounded-lg shadow-lg p-6 w-[860px] max-h-[80vh] overflow-y-auto text-center">
          <p className="text-lg font-medium mb-4 text-black">{message}</p>

          {list.length > 0 && (
            <table className="w-full border border-gray-300 text-sm mb-4 text-black">
              <thead className="bg-gray-100 text-black sticky top-0">
                <tr>
                  <th className="border px-2 py-1 text-black">児童ID</th>
                  <th className="border px-2 py-1 text-black">児童名</th>
                  <th className="border px-2 py-1 text-black">検索文字</th>
                  <th className="border px-2 py-1 text-black">利用種別</th>
                  <th className="border px-2 py-1 text-black">開始時刻</th>
                  <th className="border px-2 py-1 text-black">終了時刻</th>
                  <th className="border px-2 py-1 text-black">施設名</th>
                </tr>
              </thead>

              <tbody>
                {list.map((child) => {
                  const id = String(child.children_id);

                  const existingChild = childrenData.find(
                    (c) => String(c.id) === String(child.children_id)
                  );

                  const isExisting = !!existingChild;
                  const selected = selectedValues[id] ?? {};

                  const pronunciationValue = toSelectValue(
                    existingChild?.pronunciation_id ??
                      selected.pronunciation_id
                  );

                  const childrenTypeValue = toSelectValue(
                    existingChild?.children_type_id ??
                      selected.children_type_id
                  );

                  const supportStartTimeValue = toSelectValue(
                    selected.support_start_time
                  );

                  const supportEndTimeValue = toSelectValue(
                    selected.support_end_time
                  );

                  // セレクト変更済みならそれを優先、未変更なら FACILITY_ID
                  const facilityValue = resolveSelectedFacilityId(selected);

                  return (
                    <tr key={id} className="hover:bg-blue-50 text-black">
                      <td className="border px-2 py-1 text-black">
                        {child.children_id}
                      </td>

                      <td className="border px-2 py-1 text-black">
                        {child.children_name}
                      </td>

                      <td className="border px-2 py-1">
                        <select
                          className={`border px-2 py-1 w-full text-black ${
                            isExisting
                              ? "bg-gray-100 text-black opacity-100"
                              : ""
                          }`}
                          value={pronunciationValue}
                          disabled={isExisting}
                          onChange={(e) =>
                            handleSelectChange(
                              child.children_id,
                              "pronunciation_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">未選択</option>
                          {pronunciation.map((p) => (
                            <option key={p.id} value={String(p.id)}>
                              {p.pronunciation}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="border px-2 py-1">
                        <select
                          className={`border px-2 py-1 w-full text-black ${
                            isExisting
                              ? "bg-gray-100 text-black opacity-100"
                              : ""
                          }`}
                          value={childrenTypeValue}
                          disabled={isExisting}
                          onChange={(e) =>
                            handleSelectChange(
                              child.children_id,
                              "children_type_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">未選択</option>
                          {childrenType.map((t) => (
                            <option key={t.id} value={String(t.id)}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="border px-2 py-1">
                        <select
                          className="border bg-slate-50 px-2 py-1 w-full text-black"
                          value={supportStartTimeValue}
                          onChange={(e) =>
                            handleSelectChange(
                              child.children_id,
                              "support_start_time",
                              e.target.value
                            )
                          }
                        >
                          <option value="">未設定</option>
                          {TIME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="border px-2 py-1">
                        <select
                          className="border bg-slate-50 px-2 py-1 w-full text-black"
                          value={supportEndTimeValue}
                          onChange={(e) =>
                            handleSelectChange(
                              child.children_id,
                              "support_end_time",
                              e.target.value
                            )
                          }
                        >
                          <option value="">未設定</option>
                          {TIME_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="border px-2 py-1">
                        <select
                          className="border bg-slate-50 px-2 py-1 w-full text-black"
                          value={facilityValue}
                          onChange={(e) =>
                            handleSelectChange(
                              child.children_id,
                              "facility_id",
                              e.target.value
                            )
                          }
                        >
                          <option value="">施設を選択</option>
                          {facilityOptions.map((facility) => {
                            const facilityId = getFacilityId(facility);
                            const facilityName = getFacilityName(facility);

                            return (
                              <option
                                key={String(facilityId)}
                                value={String(facilityId)}
                              >
                                {facilityName || `施設ID: ${facilityId}`}
                              </option>
                            );
                          })}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {submitError && (
            <div
              className="mb-4 rounded border border-red-300 bg-red-50 px-3 py-2 text-left text-sm text-red-700"
              role="alert"
            >
              {submitError}
            </div>
          )}

          <div className="flex justify-around">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              はい
            </button>

            <button
              type="button"
              onClick={() => {
                setSubmitError("");
                onCancel();
              }}
              disabled={isSubmitting}
              className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
            >
              いいえ
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}

export default ConfirmModal;
