// renderer/src/Sidebar/NomalMode/Dashboard/TabsContainer/SelectChildren/AiContents/parts/PersonalRecordPrompt/index.jsx

import React, { useState } from "react";

import { useAppState } from "@/AppStateContext";
import { useToast } from "@/provider/ToastProvider/ToastContext";

import { useDispatch, useSelector } from "react-redux";

import {
  setAiText,
  sendStart,
  sendSuccess,
  sendError,
} from "@/store/slices/sendTextSlice";

import MemoInputBox from "@/components/ui/MemoInputBox";

import PersonalRecordPromptBox, {
  getPersonalRecordPromptConfig,
} from "@/components/ui/PersonalRecordPromptBox";

import ChildNotesTabs from "../ChildNotesTabs";

const DBG = "PersonalRecordPrompt";

export default function PersonalRecordPrompt({
  sendPrompt,
  aiName = "AI",
  promptKey = "personal",
  renderResultArea = null,
  resultAreaLabel = "API 返却値",
  showTabButton = null,
}) {
  const appState = useAppState();
  const { PROMPTS, } = appState;

  // =============================================================
  // 個人記録プロンプト選択
  // =============================================================
  const [selectedPromptKey, setSelectedPromptKey] = useState("personalRecord");

  // =============================================================
  // DB保存済みメモ
  // ProfessionalPrompt1 と同じ方式
  // =============================================================
  const [dbNote, setDbNote] = useState("");

  const dispatch = useDispatch();

  // Redux上のAI入力欄管理キー
  // ここは personalRecord / personalRecord2 の切替とは別物なので固定
  const PROMPT_KEY = "personalRecord";

  const aiText = useSelector(
    (state) =>
      state.sendText?.[PROMPT_KEY]?.aiText ?? ""
  );

  const sending = useSelector(
    (state) =>
      state.sendText?.[PROMPT_KEY]?.sending ?? false
  );

  const {
    showSuccessToast,
    showErrorToast,
    showInfoToast,
  } = useToast();

  // =============================================================
  // 選択中プロンプト設定
  // =============================================================
  const promptConfig =
    getPersonalRecordPromptConfig(
      selectedPromptKey
    );

  const useDbNote =
    promptConfig?.useDbNote === true;

  // =============================================================
  // DEBUG
  // =============================================================
  const logDbg = (field, msg, extra = {}) => {
    console.log(`[${DBG}:${field}]`, msg, {
      SELECT_CHILD: appState.SELECT_CHILD,
      PROMPT_KEY,
      selectedPromptKey,
      useDbNote,
      aiName,
      promptKey,

      aiTextLen:
        typeof aiText === "string"
          ? aiText.length
          : -1,

      dbNoteLen:
        typeof dbNote === "string"
          ? dbNote.length
          : -1,

      ...extra,
    });
  };

  // =============================================================
  // AI送信
  // =============================================================
  const clickEnterButton = async () => {
    if (
      !aiText ||
      aiText.trim() === ""
    ) {
      return;
    }

    if (sending) {
      return;
    }

    const selectedPrompt =
      PROMPTS?.[selectedPromptKey]?.content ??
      "";

    // =========================================================
    // 個人記録1
    //
    //   selectedPrompt
    //   aiText
    //
    // 個人記録2
    //
    //   dbNote
    //   selectedPrompt
    //   aiText
    //
    // ProfessionalPrompt1 と同じ3ブロック構成
    // =========================================================
    const textValue = useDbNote
      ? `${dbNote}\n\n\n${selectedPrompt}\n\n\n${aiText}`
      : `${selectedPrompt}\n\n\n${aiText}`;

    logDbg(
      "send",
      "送信データ作成",
      {
        selectedPromptKey,
        useDbNote,
        selectedPromptLength:
          selectedPrompt.length,
        textValueLength:
          textValue.length,
      }
    );

    dispatch(
      sendStart({
        key: PROMPT_KEY,
      })
    );

    showInfoToast(
      `${aiName} に送信中…`
    );

    try {
      // promptKey は personal のまま
      // selectedPromptKey にはしない
      const success =
        await sendPrompt({
          textValue,
          promptKey,
        });

      if (!success) {
        throw new Error(
          `sendPromptTo${aiName} returned false`
        );
      }

      dispatch(
        sendSuccess({
          key: PROMPT_KEY,
        })
      );

      showSuccessToast(
        `${aiName} に送信しました`
      );
    } catch (error) {
      console.error(
        "送信エラー:",
        error
      );

      dispatch(
        sendError({
          key: PROMPT_KEY,
          error:
            error?.message ??
            "送信に失敗しました",
        })
      );

      showErrorToast(
        `${aiName} への送信に失敗しました`
      );
    }
  };

  return (
    <div className="flex flex-col gap-2 p-3 w-full">

      {/* =====================================================
          DB保存済みメモ

          personalRecord2 のときだけ表示

          ProfessionalPrompt1 と同じ
          ChildNotesTabs → setDbNote
      ===================================================== */}
      {useDbNote && (
        <ChildNotesTabs
          defaultTab={"notes2"}
          onNotesChange={(
            notes,
            noteNo,
            column
          ) => {
            logDbg(
              "dbNote",
              "ChildNotesTabs 変更",
              {
                noteNo,
                column,
                notesLength:
                  notes?.length ?? 0,
              }
            );

            setDbNote(
              notes ?? ""
            );
          }}
        />
      )}

      {/* =====================================================
          個人記録プロンプト
      ===================================================== */}
      <PersonalRecordPromptBox
        prompts={PROMPTS}
        selectedPromptKey={
          selectedPromptKey
        }
        onChange={(nextKey) => {
          logDbg(
            "selectedPromptKey",
            "プロンプト変更",
            {
              prev:
                selectedPromptKey,
              next:
                nextKey,
            }
          );

          setSelectedPromptKey(
            nextKey
          );
        }}
      />

      {/* =====================================================
          AI入力
      ===================================================== */}
      <div className="flex flex-col gap-1">
        <label className="font-bold text-gray-700 block mb-1">
          AIに送信するテキスト
        </label>

        <textarea
          className="w-full h-40 p-2 border bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="AIに送信する内容を入力..."
          value={aiText}
          onFocus={(e) =>
            logDbg(
              "aiText",
              "focus",
              {
                readOnly:
                  e.target.readOnly,

                disabled:
                  e.target.disabled,

                valueLength:
                  e.target.value
                    ?.length ?? 0,

                activeElementIsSelf:
                  document.activeElement ===
                  e.target,
              }
            )
          }
          onBlur={() =>
            logDbg(
              "aiText",
              "blur",
              {}
            )
          }
          onKeyDown={(e) =>
            logDbg(
              "aiText",
              "keydown",
              {
                key: e.key,
                code: e.code,

                defaultPrevented:
                  e.defaultPrevented,

                isComposing:
                  e.nativeEvent
                    ?.isComposing,
              }
            )
          }
          onBeforeInput={(e) =>
            logDbg(
              "aiText",
              "beforeinput",
              {
                inputType:
                  e.inputType,

                data:
                  e.data,

                defaultPrevented:
                  e.defaultPrevented,
              }
            )
          }
          onCompositionStart={() =>
            logDbg(
              "aiText",
              "compositionstart",
              {}
            )
          }
          onCompositionEnd={(e) =>
            logDbg(
              "aiText",
              "compositionend",
              {
                data: e.data,
              }
            )
          }
          onChange={(e) => {
            const next =
              e.target.value;

            logDbg(
              "aiText",
              "onChange",
              {
                prevLength:
                  aiText.length,

                nextLength:
                  next.length,
              }
            );

            dispatch(
              setAiText({
                key: PROMPT_KEY,
                text: next,
              })
            );
          }}
        />

        {/* =================================================
            ボタン行
        ================================================= */}
        <div className="flex flex-row justify-between items-center gap-2">

          {/* 左側：AI固有ボタン */}
          <div className="flex-1">
            {showTabButton &&
              showTabButton}
          </div>

          {/* 右側：実行 */}
          <button
            type="button"
            className="w-[60%] min-w-[120px] bg-green-500 hover:bg-green-600 p-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={
              clickEnterButton
            }
            disabled={
              !aiText ||
              aiText.trim() === "" ||
              sending
            }
          >
            {sending
              ? "送信中…"
              : `${aiName}実行`}
          </button>
        </div>

        {/* =================================================
            結果表示
        ================================================= */}
        {renderResultArea && (
          <div className="mt-2">
            {renderResultArea({
              promptKey,
              label:
                resultAreaLabel,
            })}
          </div>
        )}

        {/* =================================================
            一時メモ
        ================================================= */}
        <div className="mt-2">
          <MemoInputBox
            memoType={1}
            label="一時メモ１（編集可能）"
            minHeight={200}
          />
        </div>
      </div>
    </div>
  );
}