import React from "react";
import { PersonSupportPlan, ProfessionalPlan } from "@/components/common/hug_function/Plan";
import ChildNotes from "../ChildNotesTabs/ChildNotes";

/**
 * 保存済み計画の表示と更新ボタンを一体化したパネル。
 * type="individual" -> children.notes2 / 個別支援計画
 * type="professional" -> children.notes / 専門的支援計画
 */
export default function PlanNotesPanel({
  spaceId,
  type = "individual",
  notes = "",
  emptyText = "メモがありません",
}) {
  const isIndividual = type === "individual";

  return (
    <section className="w-full min-w-0">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-700">
          {isIndividual ? "個別支援計画" : "専門的支援計画"}
        </span>
        {isIndividual ? (
          <PersonSupportPlan spaceId={spaceId} />
        ) : (
          <ProfessionalPlan spaceId={spaceId} />
        )}
      </div>
      <ChildNotes notes={notes} emptyText={emptyText} />
    </section>
  );
}
