// renderer/src/components/Sidebar/TabsContainer/UpdateManager/Modals/DeleteModal.jsx

import { ModalPortal } from "@/components/modals/ModalPortal";

export default function DeleteModal({ open, onClose, onConfirm, manager }) {
  if (!open) return null;

  const facilityId = Number(manager?.facility_id);
  const childrenId = Number(manager?.children_id);
  const staffId = Number(manager?.staff_id);
  const dayOfWeekId = Number(manager?.day_of_week_id);

  const hasFacilityId = Number.isFinite(facilityId);
  const hasChildrenId = Number.isFinite(childrenId);
  const hasStaffId = Number.isFinite(staffId);
  const hasDayOfWeekId = Number.isFinite(dayOfWeekId);

  const canDelete = hasFacilityId && hasChildrenId && hasStaffId;

  const handleDelete = () => {
    if (!canDelete) {
      console.warn("⚠️ DeleteModal: 削除に必要なIDが不足しています", {
        manager,
        facilityId,
        childrenId,
        staffId,
        dayOfWeekId,
      });
      return;
    }

    onConfirm(
      {
        ...manager,
        facility_id: facilityId,
        children_id: childrenId,
        staff_id: staffId,
        day_of_week_id: hasDayOfWeekId ? dayOfWeekId : manager?.day_of_week_id,
      },
      "delete"
    );
  };

  return (
    <ModalPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-96 rounded-xl bg-white p-6 text-black shadow-xl">
          <h2 className="mb-4 text-lg font-bold text-black">削除確認</h2>

          <p className="text-sm text-black">以下の担当データを削除しますか？</p>

          <div className="mt-3 rounded-md border bg-gray-50 p-3 text-sm text-black">
            <p className="text-black">
              <b>施設ID:</b> {hasFacilityId ? facilityId : "-"}
            </p>
            <p className="text-black">
              <b>児童ID:</b> {hasChildrenId ? childrenId : "-"}
            </p>
            <p className="text-black">
              <b>子ども名:</b> {manager?.children_name ?? "-"}
            </p>
            <p className="text-black">
              <b>スタッフID:</b> {hasStaffId ? staffId : "-"}
            </p>
            <p className="text-black">
              <b>スタッフ:</b> {manager?.staff_name ?? "-"}
            </p>

            {hasDayOfWeekId && (
              <p className="text-black">
                <b>曜日ID:</b> {dayOfWeekId}
              </p>
            )}
          </div>

          {!canDelete && (
            <p className="mt-3 text-xs text-red-500">
              facility_id / children_id / staff_id のいずれかが取得できないため削除できません。
            </p>
          )}

          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              className="rounded-md border px-4 py-2 text-sm text-black"
              onClick={onClose}
            >
              キャンセル
            </button>

            <button
              type="button"
              className={`rounded-md px-4 py-2 text-sm text-white ${
                canDelete
                  ? "bg-red-500 hover:bg-red-600"
                  : "cursor-not-allowed bg-gray-300"
              }`}
              disabled={!canDelete}
              onClick={handleDelete}
            >
              削除
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}