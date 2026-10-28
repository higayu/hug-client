export async function upsertPersonSupportPlan({ selectChild, markdown, loadDataBase }) {
  if (!selectChild || !markdown) throw new Error("保存対象が空です");
  const update = window.electronAPI?.laravel_children_update;
  if (typeof update !== "function") throw new Error("laravel_children_update が利用できません");
  const result = await update({ pk: "id", values: String(selectChild), data: { notes: markdown } });
  if (result?.success === false) throw new Error(result.message || "児童情報の更新に失敗しました");
  await loadDataBase?.({ reason: "manual/PersonSupportPlan" });
}
