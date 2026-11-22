async function invoke(action, payload) {
  const api = window.electronAPI?.[`laravel_aiPromptHistories_${action}`];
  if (typeof api !== "function") throw new Error("履歴機能を利用するにはアプリを再起動してください。");
  const result = await api(payload);
  if (!result?.success) {
    throw new Error(result?.error?.details?.message || result?.message || "プロンプト履歴を操作できませんでした。");
  }
  return result.data;
}

export const getPromptHistories = (payload) => invoke("list", payload);
export const getPromptHistory = (payload) => invoke("show", payload);
export const restorePromptHistory = (payload) => invoke("restore", payload);
