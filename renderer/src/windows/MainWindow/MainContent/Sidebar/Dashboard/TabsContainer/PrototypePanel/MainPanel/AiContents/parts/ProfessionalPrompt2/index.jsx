// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/parts/ProfessionalPrompt2/index.jsx
import React, { useState, useEffect } from "react";
import { useAppState } from "@/AppStateContext";
import MemoInputBox from '@/components/ui/MemoInputBox';

const DBG = 'ProfessionalPrompt2';

export default function ProfessionalPrompt2({
  sendPrompt,
  aiName = "AI",
  promptKey = "professional2",
  renderResultArea = null,
  resultAreaLabel = "API 返却値（専門2）",
  buttonLabel = "実行",
}) {
  const { PROMPTS } = useAppState();

  const [text1, setText1] = useState("");
  const [aiText, setAiText] = useState("");

  const logDbg = (field, msg, extra = {}) => {
    console.log(`[${DBG}:${field}]`, msg, {
      aiTextLen: aiText.length,
      ...extra,
    });
  };

  // 🔥 初期値セット（PROMPTS 全体を監視）
  useEffect(() => {
    const next = PROMPTS?.professional2?.content ?? "";
    logDbg('promptText1', 'PROMPTS から text1 反映', {
      nextLength: next.length,
      hasPrompts: !!PROMPTS,
      promptsKeys: PROMPTS ? Object.keys(PROMPTS) : []
    });
    setText1(next);
  }, [PROMPTS]);

  // ★ 送信する文字列を組み立てるだけ
  const textValue = `${text1}\n\n\n${aiText}`;

  const clickEnterButton = async () => {
    if (!aiText || aiText.trim() === "") return;
    await sendPrompt({ textValue, promptKey });
  };

  return (
    <div className="flex flex-col gap-4 p-3 w-full">

      {/* ===== プロンプト ===== */}
      <div className="flex flex-col gap-1">
        <label className="font-semibold">専門的支援加算用プロンプト2</label>
        <textarea
          className="w-full h-20 bg-gray-900 text-white rounded-lg p-2"
          value={text1}
          readOnly
          onFocus={(e) =>
            logDbg('promptText1', 'focus（readOnly: 仕様上ここでは編集不可）', {
              readOnly: e.target.readOnly,
              valueLength: e.target.value?.length ?? 0,
            })
          }
          onKeyDown={(e) =>
            logDbg('promptText1', 'keydown', {
              key: e.key,
              defaultPrevented: e.defaultPrevented,
            })
          }
        />
      </div>

      {/* --- AI入力 --- */}
      <div className="mt-4">
        <label className="font-bold text-gray-700 block mb-1">
          AIに送信するテキスト
        </label>
        <textarea
          className="w-full h-40 bg-gray-700 text-white rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={aiText}
          placeholder="AIに送信する内容を入力..."
          onFocus={(e) =>
            logDbg('aiText', 'focus', {
              readOnly: e.target.readOnly,
              disabled: e.target.disabled,
              valueLength: e.target.value?.length ?? 0,
              activeElementIsSelf: document.activeElement === e.target,
            })
          }
          onBlur={() => logDbg('aiText', 'blur', {})}
          onKeyDown={(e) =>
            logDbg('aiText', 'keydown', {
              key: e.key,
              code: e.code,
              defaultPrevented: e.defaultPrevented,
              isComposing: e.nativeEvent?.isComposing,
            })
          }
          onBeforeInput={(e) =>
            logDbg('aiText', 'beforeinput', {
              inputType: e.inputType,
              data: e.data,
              defaultPrevented: e.defaultPrevented,
            })
          }
          onCompositionStart={() => logDbg('aiText', 'compositionstart', {})}
          onCompositionEnd={(e) =>
            logDbg('aiText', 'compositionend', { data: e.data })
          }
          onChange={(e) => {
            const next = e.target.value;
            logDbg('aiText', 'onChange', {
              prevLength: aiText.length,
              nextLength: next.length,
            });
            setAiText(next);
          }}
        />
      </div>

      <div className="flex flex-row justify-between items-center">
        <button
          className="w-[250px] bg-green-500 hover:bg-green-600 p-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={clickEnterButton}
          disabled={!aiText}
        >
          {buttonLabel}
        </button>
      </div>

      {/* 結果表示エリア（任意） */}
      {renderResultArea && (
        <div className="mt-2">
          {renderResultArea({
            promptKey,
            label: resultAreaLabel,
          })}
        </div>
      )}

      <MemoInputBox
        memoType={2}
        label="一時メモ２（編集可能）"
        minHeight={200}
      />
    </div>
  );
}