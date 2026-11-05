/**
 * Laravelから指定職員の有効なAIプロンプトを取得する。
 * itemIdを省略すると全項目を取得する。
 */
export async function getActiveAiPrompts({ staffId, itemId = null, scope = null }) {
  const api = window.electronAPI?.laravel_procedure_getActiveAiPrompt;

  if (typeof api !== "function") {
    throw new Error("LaravelプロシージャAPIが利用できません。");
  }

  const normalizedStaffId = Number(staffId);

  if (!Number.isInteger(normalizedStaffId) || normalizedStaffId <= 0) {
    throw new Error("AIプロンプトの取得に必要なstaff_idが不正です。");
  }

  const normalizedItemId =
    itemId == null || itemId === "" ? null : Number(itemId);

  if (
    normalizedItemId !== null &&
    (!Number.isInteger(normalizedItemId) || normalizedItemId <= 0)
  ) {
    throw new Error("item_idが不正です。");
  }

  if (scope !== null && scope !== "company") {
    throw new Error("プロンプトの取得範囲が不正です。");
  }

  const result = await api({
    staff_id: normalizedStaffId,
    item_id: normalizedItemId,
    ...(scope === "company" ? { scope: "company" } : {}),
  });

  if (result?.success === false) {
    throw new Error(
      result.message || "有効なAIプロンプトの取得に失敗しました。",
    );
  }

  const rows = result?.data ?? result;

  if (!Array.isArray(rows)) {
    throw new Error("AIプロンプトのレスポンス形式が不正です。");
  }

  return rows;
}
