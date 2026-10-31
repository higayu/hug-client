
import React from "react";

/**
 * MemoInputBox の既存実装に手を加えず、同じ画面内のメモをAI欄へ渡す。
 * 転送元を親から渡された DOM コンテナに限定するため、複数の児童・スペースを
 * 同時に表示しても別のメモを読み取らない。
 */
export default function MemoToAiTransferButton({
  memoContainerRef,
  memoType = 1,
  onTransfer,
  onError,
  disabled = false,
}) {
  const handleTransfer = () => {
    const root = memoContainerRef?.current;
    const textarea = root?.querySelector(
      `textarea[data-memo-input="true"][data-memo-type="${memoType}"]`
    );

    if (!textarea) {
      onError?.("一時メモの入力欄が見つかりません");
      return;
    }

    // hidden クラスで非表示の間も textarea.value は保持される。
    const text = textarea.value;

    if (!text.trim()) {
      onError?.("転送する一時メモが空です");
      return;
    }

    onTransfer?.(text);
  };

  return (
    <button
      type="button"
      disabled={disabled || typeof onTransfer !== "function"}
      onClick={handleTransfer}
      title="一時メモ１の内容をAI入力欄へ移す（AI欄は上書き）"
      className="
        inline-flex min-w-[150px] items-center justify-center
        rounded-md
        bg-lime-200 px-4 py-2
        text-sm font-semibold text-lime-950
        shadow-sm
        transition-colors
        hover:bg-lime-300
        active:bg-lime-400
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
    >
      ↑ AI入力へ移す
    </button>
  );
}
