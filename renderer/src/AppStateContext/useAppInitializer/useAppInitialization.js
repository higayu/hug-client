import { useEffect, useRef } from "react";
import { loadAllReload } from "@/utils/config/reloadSettings.js";

export function useAppInitialization() {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return undefined;
    initializedRef.current = true;

    const reload = async () => {
      try {
        await loadAllReload();
      } catch (error) {
        console.error("[useAppInitialization] Settings reload failed:", error);
      }
    };

    void reload();

    const removeCloseListener = window.electronAPI?.onConfirmCloseRequest?.(() => {
      const shouldClose = window.confirm("アプリケーションを終了しますか？");
      window.electronAPI?.sendConfirmCloseResponse?.(shouldClose);
    });

    window.addEventListener("app-settings-updated", reload);

    return () => {
      window.removeEventListener("app-settings-updated", reload);
      if (typeof removeCloseListener === "function") removeCloseListener();
    };
  }, []);
}
