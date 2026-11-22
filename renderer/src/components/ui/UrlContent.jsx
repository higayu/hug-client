import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getActiveWebview } from "@/utils/webview/webviewState.js";
import { setCurrentUrl } from "@/store/slices/webviewSlice";

export default function UrlContent() {
  const dispatch = useDispatch();
  const currentUrl = useSelector(
    (state) => state.webview.currentUrl
  );

  useEffect(() => {
    let cleanupWebviewListeners = null;
  
    const readUrl = (vw) => {
      if (!vw) {
        dispatch(setCurrentUrl(""));
        return;
      }
  
      // まずsrcをフォールバックとして確保（例外でも表示できるように）
      const fallback =
        (typeof vw.getAttribute === "function" && vw.getAttribute("src")) ||
        vw.src ||
        "";
  
      try {
        const url = typeof vw.getURL === "function" ? vw.getURL() : "";
        dispatch(setCurrentUrl(url || fallback || ""));
      } catch {
        // dom-ready前などでgetURLが落ちるならsrcだけでも出す
        dispatch(setCurrentUrl(fallback || ""));
      }
    };
  
    const attachWebviewListeners = (vw) => {
      if (!vw) return () => {};
  
      const onNavigate = () => readUrl(vw);
  
      vw.addEventListener("dom-ready", onNavigate);
      vw.addEventListener("did-navigate", onNavigate);
      vw.addEventListener("did-navigate-in-page", onNavigate);
      vw.addEventListener("did-finish-load", onNavigate);
  
      return () => {
        vw.removeEventListener("dom-ready", onNavigate);
        vw.removeEventListener("did-navigate", onNavigate);
        vw.removeEventListener("did-navigate-in-page", onNavigate);
        vw.removeEventListener("did-finish-load", onNavigate);
      };
    };
  
    const initial = getActiveWebview();
    cleanupWebviewListeners = attachWebviewListeners(initial);
    readUrl(initial); // ★ 初回も即読み取り
  
    const onActiveChanged = (e) => {
      const vw = e?.detail?.webview || getActiveWebview();
      if (cleanupWebviewListeners) cleanupWebviewListeners();
      cleanupWebviewListeners = attachWebviewListeners(vw);
      readUrl(vw); // ★ 切替直後も即読み取り
    };
  
    document.addEventListener("active-webview-changed", onActiveChanged);
  
    return () => {
      document.removeEventListener("active-webview-changed", onActiveChanged);
      if (cleanupWebviewListeners) cleanupWebviewListeners();
    };
  }, [dispatch]);
  

  return (
    <div className="flex items-center">
      <input
        type="text"
        readOnly
        value={currentUrl}
        className="font-medium text-gray-600 bg-slate-50 px-3 py-2 border border-gray-300 rounded-md text-sm"
        placeholder="URLを取得中..."
        title={currentUrl || "URLを取得中..."}
      />
    </div>
  );
}
