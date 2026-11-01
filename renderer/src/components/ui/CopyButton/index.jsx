// components/ui/CopyButton/index.jsx
import React, { useCallback } from "react";
import { Copy } from "lucide-react";
import { useToast } from "@/utils/notifications.jsx";

export default function CopyButton({ text, title='', className='',fontStyle='text-black' }) {
  const { showSuccessToast, showErrorToast } = useToast();

  const fallbackCopy = useCallback((value) => {
    const ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    ta.style.left = "-9999px";

    document.body.appendChild(ta);
    ta.focus();
    ta.select();

    const ok = document.execCommand("copy");
    document.body.removeChild(ta);

    if (!ok) {
      throw new Error("fallback copy failed");
    }
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      if (typeof text !== "string") {
        throw new TypeError("CopyButton: text must be a string");
      }

      if (!text.trim()) {
        throw new Error("コピーする文字列が空です");
      }

      // Electron preload 経由のコピーを優先
      if (window.electronAPI?.copyText) {
        await window.electronAPI.copyText(text);
      } else {
        // Electron API がない場合だけブラウザAPI / fallback
        try {
          if (!navigator?.clipboard?.writeText) {
            throw new Error("navigator.clipboard.writeText is unavailable");
          }

          await navigator.clipboard.writeText(text);
        } catch {
          fallbackCopy(text);
        }
      }

      showSuccessToast("コピーしました");
    } catch (e) {
      console.error("copy failed:", e);
      showErrorToast("コピーに失敗しました");
    }
  }, [text, fallbackCopy, showSuccessToast, showErrorToast]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label="コピー"
      className={`${className}`}
      title={title}
    >
      <Copy size={16} />
      <span className={`${fontStyle}`}>コピー</span>
    </button>
  );
}