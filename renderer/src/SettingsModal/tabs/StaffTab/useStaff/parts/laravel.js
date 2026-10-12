export async function updateStaff(payload) {
  const api =
    window.electronAPI?.laravel_staff_update;

  if (typeof api !== "function") {
    throw new Error(
      "Laravel職員更新APIが利用できません。",
    );
  }

  return api(payload);
}