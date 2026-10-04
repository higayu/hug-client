export async function upsertPersonSupportPlan({ selectChild, markdown, loadDataBase }) {
  if (!selectChild || !markdown) return;

  const childrenUpdate = window.electronAPI?.laravel_children_update;
  if (typeof childrenUpdate !== "function") {
    throw new Error("laravel_children_update が利用できません");
  }

  const updateResult = await childrenUpdate({
    pk: "id",
    values: String(selectChild),
    data: { notes2: markdown },
  });
  if (updateResult?.success === false) {
    throw new Error(updateResult.message || "児童情報の更新に失敗しました");
  }

  await loadDataBase({ reason: "manual/PersonSupportPlan" });
}
