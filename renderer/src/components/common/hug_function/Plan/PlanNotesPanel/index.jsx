import React from "react";
import PersonSupportPlan from "../PersonSupportPlan";
import ProfessionalPlan from "../ProfessionalPlan";

/**
 * 保存済み計画の本文表示と取得・更新ボタンを一体化したパネル。
 *
 * type="individual"   : 個別支援計画（notes2）
 * type="professional" : 専門的支援計画（notes）
 *
 * 本文は親から notes として渡し、ボタンは既存の取得・DB更新処理をそのまま使用。
 */
export default function PlanNotesPanel({
  spaceId,
  childId,
  type = "individual",
  notes = "",
  emptyText = "メモがありません",
  className = "",
  onUpdated,
  updateControl,
}) {
  const individual = type === "individual";

  return (
    <section className={`w-full min-w-0 ${className}`}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-700">
          {individual ? "個別支援計画" : "専門的支援計画"}
        </span>
        {updateControl !== undefined ? updateControl : individual ? (
          <PersonSupportPlan spaceId={spaceId} />
        ) : (
          <ProfessionalPlan spaceId={spaceId} childId={childId} onUpdated={onUpdated} />
        )}
      </div>
      <div className="max-h-64 overflow-y-auto rounded bg-gray-700 p-2 text-xs text-white whitespace-pre-wrap">
        {notes || emptyText}
      </div>
    </section>
  );
}
