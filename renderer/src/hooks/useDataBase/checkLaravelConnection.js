export async function checkLaravelConnection() {
  try {
    const api = window.electronAPI?.checkLaravelConnection;
    if (typeof api !== "function") {
      throw new Error("Laravel connection API is not exposed.");
    }

    const result = await api();
    const connected = result?.connected ?? result?.success ?? false;

    return {
      ...result,
      success: connected,
      connected,
      databaseType: "laravel",
      switchedDatabaseType: "laravel",
    };
  } catch (error) {
    return {
      success: false,
      connected: false,
      databaseType: "laravel",
      switchedDatabaseType: "laravel",
      message: error?.message || "Laravel API connection failed.",
      error,
    };
  }
}

export async function switchDatabaseType() {
  const result = await window.electronAPI?.switchDatabaseMode?.("laravel");
  return {
    ...result,
    success: result?.success !== false,
    databaseType: "laravel",
    mode: "laravel",
  };
}
