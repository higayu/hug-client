import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
} from "react";

import { useToast } from "@/provider/ToastProvider/ToastContext.jsx";
import { useSelector } from "react-redux";
import { selectSpaceChildId } from "@/store/slices/chilledspaceSlice.js";
import { useNote } from "@/hooks/useNote";
import PersonalRecordButton from "@/components/common/PersonalRecordButton";
import CopyButton from "@/components/ui/CopyButton";


export default function MemoInputBox({
  memoType,
  label,
  minHeight = 100,
  spaceId,
}) {
  const textareaRef = useRef(null);

  // 最新の読込処理だけを有効にする番号
  const loadSeqRef = useRef(0);

  // ユーザーが入力を始めたか
  const editingRef = useRef(false);

  const { showSuccessToast, showErrorToast } = useToast();
  const selectedChildId = useSelector(selectSpaceChildId(spaceId));
  const { saveTemp1, saveTemp2, loadTemp } = useNote();

  const [value, setValue] = useState("");

  /*
   * useNoteから返る関数参照が変化しても、
   * メモ読込用useEffectを不用意に再実行させない。
   */
  const loadTempRef = useRef(loadTemp);
  const saveTemp1Ref = useRef(saveTemp1);
  const saveTemp2Ref = useRef(saveTemp2);
  const showSuccessToastRef = useRef(showSuccessToast);
  const showErrorToastRef = useRef(showErrorToast);

  useEffect(() => {
    loadTempRef.current = loadTemp;
  }, [loadTemp]);

  useEffect(() => {
    saveTemp1Ref.current = saveTemp1;
  }, [saveTemp1]);

  useEffect(() => {
    saveTemp2Ref.current = saveTemp2;
  }, [saveTemp2]);

  useEffect(() => {
    showSuccessToastRef.current = showSuccessToast;
  }, [showSuccessToast]);

  useEffect(() => {
    showErrorToastRef.current = showErrorToast;
  }, [showErrorToast]);

  const textareaId = `memo-input-${memoType}`;

  const log = useCallback(
    (...args) => {
      console.log(
        "[MemoInputBox]",
        {
          label,
          memoType,
          selectedChildId,
        },
        ...args,
      );
    },
    [label, memoType, selectedChildId],
  );

  /*
   * 児童またはメモ種別が変わったときだけDBから読み込む。
   */
  useEffect(() => {
    editingRef.current = false;

    if (!selectedChildId) {
      loadSeqRef.current += 1;
      setValue("");
      return undefined;
    }

    const seq = ++loadSeqRef.current;

    const proxy = {
      set value(result) {
        /*
         * 児童切替後などに返ってきた古い通信結果は無視する。
         */
        if (seq !== loadSeqRef.current) {
          log("古い読み込み結果を無視", {
            seq,
            activeSeq: loadSeqRef.current,
          });

          return;
        }

        /*
         * API読込中にユーザーが入力を始めた場合は、
         * DBの値で入力内容を上書きしない。
         */
        if (editingRef.current) {
          log("入力中のため読み込み結果を無視", {
            seq,
          });

          return;
        }

        let nextValue = "";

        if (typeof result === "object" && result !== null) {
          nextValue =
            memoType === 1
              ? result.memo1 ?? ""
              : result.memo2 ?? "";
        } else {
          nextValue = result ?? "";
        }

        setValue(String(nextValue));
      },
    };

    async function loadMemo() {
      try {
        const currentLoadTemp = loadTempRef.current;

        if (typeof currentLoadTemp !== "function") {
          throw new Error("loadTempが利用できません。");
        }

        await currentLoadTemp(
          selectedChildId,
          proxy,
        );
      } catch (error) {
        if (seq !== loadSeqRef.current) {
          return;
        }

        console.error(
          "[MemoInputBox] メモ読込エラー",
          {
            label,
            memoType,
            selectedChildId,
            error,
          },
        );

        showErrorToastRef.current?.(
          `${label} の読み込みに失敗しました`,
        );
      }
    }

    loadMemo();

    return () => {
      /*
       * コンポーネント更新後に古い通信結果が返ってきても
       * 適用されないようにする。
       */
      if (loadSeqRef.current === seq) {
        loadSeqRef.current += 1;
      }
    };
  }, [
    selectedChildId,
    memoType,
    label,
    log,
  ]);

  /*
   * AIなどのwebviewタブを閉じたあと、
   * Electron側のフォーカスが親rendererへ戻った際に
   * メモ欄を再び入力可能な状態へ戻す。
   */
  useEffect(() => {
    function restoreTextareaFocus() {
      if (!selectedChildId) {
        return;
      }

      const textarea = textareaRef.current;

      if (
        !(textarea instanceof HTMLTextAreaElement) ||
        textarea.disabled ||
        textarea.readOnly
      ) {
        return;
      }

      /*
       * 既に別のinput/textareaを操作中なら
       * 勝手にフォーカスを奪わない。
       */
      const activeElement = document.activeElement;

      const isOtherEditableElement =
        activeElement &&
        activeElement !== document.body &&
        activeElement !== textarea &&
        (
          activeElement instanceof HTMLInputElement ||
          activeElement instanceof HTMLTextAreaElement ||
          activeElement instanceof HTMLSelectElement ||
          activeElement.isContentEditable
        );

      if (isOtherEditableElement) {
        return;
      }

      requestAnimationFrame(() => {
        if (!textarea.isConnected) {
          return;
        }

        textarea.focus({
          preventScroll: true,
        });
      });
    }

    function handleWindowFocus() {
      restoreTextareaFocus();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        restoreTextareaFocus();
      }
    }

    /*
     * closeTab側から明示的に通知できるようにする。
     *
     * 使用例:
     * window.dispatchEvent(
     *   new CustomEvent("app:webview-tab-closed")
     * );
     */
    function handleWebviewTabClosed() {
      restoreTextareaFocus();
    }

    window.addEventListener(
      "focus",
      handleWindowFocus,
    );

    window.addEventListener(
      "app:webview-tab-closed",
      handleWebviewTabClosed,
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange,
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleWindowFocus,
      );

      window.removeEventListener(
        "app:webview-tab-closed",
        handleWebviewTabClosed,
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange,
      );
    };
  }, [selectedChildId]);

  async function handleSave() {
    if (!selectedChildId) {
      return;
    }

    try {
      const saveFunction =
        memoType === 1
          ? saveTemp1Ref.current
          : saveTemp2Ref.current;

      if (typeof saveFunction !== "function") {
        throw new Error(
          memoType === 1
            ? "saveTemp1が利用できません。"
            : "saveTemp2が利用できません。",
        );
      }

      const result = await saveFunction(
        selectedChildId,
        value,
      );

      if (!result) {
        showErrorToastRef.current?.(
          `${label} の保存に失敗しました`,
        );

        return;
      }

      editingRef.current = false;

      showSuccessToastRef.current?.(
        `${label} を保存しました`,
      );
    } catch (error) {
      console.error(
        "[MemoInputBox] メモ保存エラー",
        error,
      );

      showErrorToastRef.current?.(
        `${label} の保存中にエラーが発生しました`,
      );
    }
  }

  function handleChange(event) {
    editingRef.current = true;
    setValue(event.target.value);
  }

  async function handlePaste() {
    if (!selectedChildId) {
      return;
    }

    try {
      const clipboardText = await navigator.clipboard.readText();

      editingRef.current = true;
      setValue(clipboardText ?? "");

      showSuccessToastRef.current?.(
        `${label} に貼り付けました`,
      );
    } catch (error) {
      console.error(
        "[MemoInputBox] クリップボード貼り付けエラー",
        error,
      );

      showErrorToastRef.current?.(
        "クリップボードからの貼り付けに失敗しました",
      );
    }
  }

  function handleCompositionStart() {
    editingRef.current = true;
  }

  function handleKeyDown(event) {
    /*
     * 日本語IME変換中のEnterを、
     * 親側のショートカット処理などに渡さない。
     */
    const isComposing =
      event.nativeEvent?.isComposing ||
      event.isComposing ||
      event.keyCode === 229;

    if (isComposing) {
      event.stopPropagation();
    }
  }

  function handleFocus() {
    log("textarea focus", {
      valueLength: value.length,
      activeElementIsSelf:
        document.activeElement === textareaRef.current,
    });
  }

  return (
    <div className="mt-3">
      <div className="flex gap-2 mt-1 mb-1 items-center">
        <label
          htmlFor={textareaId}
          className="px-2 py-1 text-xs font-bold text-gray-700"
        >
          {label}
        </label>
        <button
          type="button"
          onClick={handlePaste}
          disabled={!selectedChildId}
          className="
            bg-white hover:bg-slate-500
            inline-flex items-center gap-2
            rounded-2xl px-3 py-2 text-sm text-black shadow-sm
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed
          "
          title="クリップボードから貼り付け"
        >
          貼り付け
        </button>
      </div>

      <textarea
        id={textareaId}
        ref={textareaRef}
        data-memo-input="true"
        data-memo-type={memoType}
        className="
          w-full p-2 border border-gray-300 rounded text-xs
          bg-white resize-y text-black
          focus:outline-none focus:border-blue-600
          focus:ring-2 focus:ring-blue-200
          disabled:bg-gray-100 disabled:cursor-not-allowed
        "
        style={{
          minHeight,
        }}
        value={value}
        disabled={!selectedChildId}
        onChange={handleChange}
        onFocus={handleFocus}
        onCompositionStart={handleCompositionStart}
        onKeyDown={handleKeyDown}
      />

      <div className="mt-2 flex gap-2 items-stretch">
        <CopyButton 
          text={value}
          className='bg-white hover:bg-slate-500 inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm shadow-sm active:scale-[0.98]'
          fontStyle='text-black'
          title='個人記録用メモをコピー'
         />


        <button
          type="button"
          onClick={handleSave}
          disabled={!selectedChildId}
          className="
            flex-1 px-3 py-2
            bg-blue-600 text-white rounded text-xs
            hover:bg-blue-700
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
        >
          このメモを保存
        </button>

        {(memoType === 1 || memoType === 2) && (
          <PersonalRecordButton
            id={`kojin-kiroku-${memoType}`}
            disabled={!selectedChildId}
            label="個人記録"
            className="
              flex items-center justify-center shrink-0
              px-3 py-2
              rounded-lg font-bold text-xs
            "
          />
        )}
      </div>
    </div>
  );
}