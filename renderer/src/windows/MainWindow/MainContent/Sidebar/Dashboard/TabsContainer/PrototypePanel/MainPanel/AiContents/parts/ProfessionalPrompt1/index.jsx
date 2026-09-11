import React, { useState, useEffect } from "react";

import { useAppState } from "@/AppStateContext";

import ProfessionalPlan from "@/components/common/hug_function/ProfessionalPlan";
import ProfessionalSupportCheckPanel2 from "@/components/common/hug_function/ProfessionalSupportCheckPanel2";

import ChildNotesTabs from "../ChildNotesTabs";

const DBG = "ProfessionalPrompt1";

export default function ProfessionalPrompt1({
  sendPrompt,
  aiName = "AI",
  promptKey = "professional1",
  renderResultArea = null,
  resultAreaLabel = "API 返却値（専門1）",
  showSupportCheck = true,
}) {
  const appState = useAppState();

  const {
    PROMPTS,
  } = appState;

  const [text1, setText1] = useState("");
  const [aiText, setAiText] = useState("");
  const [dbNote, setDbNote] = useState("");

  const logDbg = (field, msg, extra = {}) => {
    console.log(`[${DBG}:${field}]`, msg, {
      SELECT_CHILD: appState.SELECT_CHILD,
      aiName,
      promptKey,
      aiTextLen: aiText.length,
      dbNoteLen: dbNote.length,
      ...extra,
    });
  };

  // =============================================================
  // プロンプト初期値
  // =============================================================
  useEffect(() => {
    const next =
      PROMPTS?.[promptKey]?.content ??
      PROMPTS?.professional1?.content ??
      "";

    logDbg(
      "promptText1",
      "PROMPTS から text1 反映",
      {
        promptKey,
        nextLength: next.length,
        hasPrompts: !!PROMPTS,
        promptsKeys: PROMPTS
          ? Object.keys(PROMPTS)
          : [],
      }
    );

    setText1(next);
  }, [
    PROMPTS,
    promptKey,
  ]);

  // =============================================================
  // AI送信文字列
  // =============================================================
  const textValue = `${dbNote}\n\n\n${text1}\n\n\n${aiText}`;

  const handleSendPrompt = async () => {
    if (!aiText || aiText.trim() === "") {
      return;
    }

    await sendPrompt({
      textValue,
      promptKey,
    });
  };

  return (
    <div className="flex flex-col gap-4 p-3 w-full">

      {/* =====================================================
          DB保存済みメモ
      ===================================================== */}
      <ChildNotesTabs
        defaultTab="notes"
        onNotesChange={(notes, noteNo, column) => {
          logDbg(
            "dbNote",
            "ChildNotesTabs 変更",
            {
              noteNo,
              column,
              notesLength: notes?.length ?? 0,
            }
          );

          setDbNote(notes ?? "");
        }}
      >
        <div className="flex flex-row gap-2">
          <ProfessionalPlan />
        </div>
      </ChildNotesTabs>

      {/* =====================================================
          プロンプト
      ===================================================== */}
      <div>
        <label className="font-semibold">
          専門的支援加算用プロンプト1
        </label>

        <textarea
          className="w-full h-20 bg-gray-900 text-white rounded p-2"
          value={text1}
          readOnly
          onFocus={(e) =>
            logDbg(
              "promptText1",
              "focus（readOnly: 仕様上ここでは編集不可）",
              {
                readOnly: e.target.readOnly,
                valueLength:
                  e.target.value?.length ?? 0,
              }
            )
          }
        />
      </div>

      {/* =====================================================
          AI入力
      ===================================================== */}
      <div>
        <label className="font-bold text-gray-700 block mb-1">
          AIに送信するテキスト
        </label>

        <textarea
          className="w-full h-40 bg-gray-700 text-white rounded p-2"
          value={aiText}
          placeholder="AIに送信する内容を入力..."
          onChange={(e) => {
            const next = e.target.value;

            logDbg(
              "aiText",
              "onChange",
              {
                prevLength: aiText.length,
                nextLength: next.length,
              }
            );

            setAiText(next);
          }}
        />
      </div>

      {/* =====================================================
          実行
      ===================================================== */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-row justify-between items-start gap-2">
          <button
            type="button"
            className="w-[70%] bg-green-500 hover:bg-green-600 p-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendPrompt}
            disabled={
              !aiText ||
              aiText.trim() === ""
            }
          >
            {aiName}実行
          </button>

          {showSupportCheck && (
            <div className="w-[30%]">
              <ProfessionalSupportCheckPanel2
                logTag="ProfessionalPrompt1"
                className="w-full"
                labelClassName="w-full"
              />
            </div>
          )}
        </div>

        {renderResultArea && (
          <div className="mt-2">
            {renderResultArea({
              promptKey,
              label: resultAreaLabel,
            })}
          </div>
        )}
      </div>
    </div>
  );
}