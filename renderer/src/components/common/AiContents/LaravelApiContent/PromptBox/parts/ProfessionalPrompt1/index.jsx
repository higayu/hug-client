import React, { useState, useEffect, useMemo } from "react";

import { useAppState } from "@/AppStateContext";
import { useTabs } from "@/hooks/useTabs";
import { useDispatch, useSelector } from "react-redux";
import { selectSpaceChildId, selectSpace } from "@/store/workSpaceSelectors.js";
import {
  AI_CHAT_TEXT_KEYS,
  setAiChatText,
  selectAiChatText,
} from "@/store/slices/aiChatSlice.js";


import ChildNotesTabs from "../ChildNotesTabs";
import MemoInputBox from "../MemoInputBox";

const DBG = "ProfessionalPrompt1";

export default function ProfessionalPrompt1({
  spaceId,
  sendPrompt,
  aiName = "AI",
  promptKey = "professional1",
  renderResultArea = null,
  resultAreaLabel = "API 返却値（専門1）",
  showSupportCheck = true,
  laravelApiResults = {},
}) {
  const appState = useAppState();
  const selectedChildId = useSelector(selectSpaceChildId(spaceId));
  const selectedSpace = useSelector(selectSpace(spaceId));

  const {
    PROMPTS,
    CURRENT_YMD,
    FACILITY_ID,
    attendanceData,
  } = appState;

  const { addProfessionalSupportListTab } = useTabs(spaceId);

  const attendanceItem = useMemo(() => {
    const list = Array.isArray(attendanceData)
      ? attendanceData
      : Array.isArray(attendanceData?.data)
        ? attendanceData.data
        : [];

    return list.find((item) =>
      String(item?.children_id ?? item?.child_id ?? item?.id ?? '') ===
      String(selectedChildId ?? '')
    ) ?? null;
  }, [attendanceData, selectedChildId]);

  const selectedChildName =
    selectedSpace?.childName ??
    attendanceItem?.children_name ??
    attendanceItem?.name ??
    '';

  const attendanceEnterText = String(attendanceItem?.column5 ?? '').trim();
  const attendanceLeaveText = String(attendanceItem?.column6 ?? '').trim();
  const isAbsent = attendanceEnterText.startsWith('欠席');
  const hasEntered = /^\d{1,2}:\d{2}$/.test(attendanceEnterText);
  const hasExited = /^\d{1,2}:\d{2}$/.test(attendanceLeaveText);
  const isUIEnabled = Boolean(selectedChildId && attendanceItem);

  const [text1, setText1] = useState("");
  const [dbNote, setDbNote] = useState("");
  const [sending, setSending] = useState(false);

  const dispatch = useDispatch();

  // AI入力欄は「日付 + 児童ID + 専門的支援1」で管理する。
  const AI_TEXT_KEY = AI_CHAT_TEXT_KEYS.PROFESSIONAL_1;

  const aiText = useSelector(
    selectAiChatText(
      CURRENT_YMD,
      selectedChildId,
      AI_TEXT_KEY
    )
  );

  const logDbg = (field, msg, extra = {}) => {
    console.log(`[${DBG}:${field}]`, msg, {
      childId: selectedChildId,
      date: CURRENT_YMD,
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
  // Laravel retrieves the saved plan and prompt. Only send the input text.
  const message = aiText;

  const textValue = `${text1}\n\n\n${message}`;

  const handleSendPrompt = async () => {
    if (!selectedChildId || !aiText || aiText.trim() === "" || sending) {
      return;
    }

    setSending(true);
    try {
      await sendPrompt({ textValue, prompt: text1, message, promptKey, childId: selectedChildId });
    } catch {
      // LaravelApiContent displays the failure toast; do not leave an unhandled rejection.
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-3 w-full">

      {/* =====================================================
          DB保存済みメモ
      ===================================================== */}
      <ChildNotesTabs
        spaceId={spaceId}
        defaultTab="notes2"
        displayMode="single"
        noteKey="notes2"
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
      />

      {/* =====================================================
          プロンプト
      ===================================================== */}
      <div>
        <label className="font-semibold">
          専門的支援プロンプト（計画を使った文章生成）
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
      <p className="text-xs text-gray-500">保存済みの専門的支援計画とプロンプトを使い、1回のAI処理で文章を生成します。</p>
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

            dispatch(
              setAiChatText({
                date: CURRENT_YMD,
                childId: selectedChildId,
                key: AI_TEXT_KEY,
                text: next,
              })
            );
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
            aria-busy={sending}
            className="flex min-h-10 w-[70%] items-center justify-center gap-2 bg-green-500 p-2 rounded text-white enabled:hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendPrompt}
            disabled={
              !aiText ||
              !selectedChildId || sending ||
              aiText.trim() === ""
            }
          >
            {sending ? (
              <>
                <span
                  aria-hidden="true"
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-white/40 border-t-white"
                />
                <span>生成中…</span>
              </>
            ) : (
              `${aiName}実行`
            )}
          </button>
        </div>

        {renderResultArea && (
          <div className="mt-2">
            {renderResultArea({
              promptKey,
              label: resultAreaLabel,
            })}
          </div>
        )}

        <div className="mt-2">
          <MemoInputBox
            laravelApiResult={laravelApiResults[promptKey]}
            childId={selectedChildId}
            childName={selectedChildName}
            spaceId={spaceId}
            memoType={2}
            label="一時メモ２（編集可能）"
            minHeight={200}
          />
        </div>
      </div>
    </div>
  );
}
