import { executeFlowV2 } from "@/components/WebAutomationV2";

export async function fetchProfessionalPlan({ childId, facilityId, loadDataBase, onUpdated }) {
  if (!childId) throw new Error("児童IDが指定されていません");
  const result = await executeFlowV2("professional_plan_fetch", { facilityId, childId });
  if (!result?.markdown) throw new Error("専門的支援計画の本文がありません");
  const update = window.electronAPI?.laravel_children_update;
  if (typeof update !== "function") throw new Error("laravel_children_update が利用できません");
  const saved = await update({ pk: "id", values: String(childId), data: { notes2: result.markdown } });
  if (saved?.success === false) throw new Error(saved.message || "専門的支援計画の保存に失敗しました");
  await loadDataBase?.({ reason: "manual/ProfessionalPlan" });
  onUpdated?.(result.markdown);
  return result.markdown;
}
