import React, {
  useState,
  useEffect,
  useMemo,
  useId,
} from "react";

import { useAppState } from "@/AppStateContext";
import { useTabs } from "@/hooks/useTabs";
import { useDispatch, useSelector } from "react-redux";
import {
  selectSpaceChildId,
  selectSpace,
} from "@/store/workSpaceSelectors.js";

import {
  AI_CHAT_TEXT_KEYS,
  setAiChatText,
  selectAiChatText,
} from "@/store/slices/aiChatSlice.js";

import ChildNotesTabs from "../ChildNotesTabs";
import MemoInputBox from "@/components/ui/MemoInputBox";

const DBG = "ProfessionalPrompt1";

export default function ProfessionalPrompt1({
  spaceId,
  sendPrompt,
  aiName = "AI",
  promptKey = "professional1",
  renderResultArea = null,
  resultAreaLabel = "API 返却値（専門的支援）",
  showSupportCheck = true,

  // プロンプト表示領域の開閉制御
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
}) {
  const appState = useAppState();

  const selectedChildId = useSelector(
    selectSpaceChildId(spaceId)
  );

  const selectedSpace = useSelector(
    selectSpace(spaceId)
  );

  const {
    PROMPTS,
    CURRENT_YMD,
    FACILITY_ID,
    attendanceData,
  } = appState;

  const { addProfessionalSupportListTab } =
    useTabs(spaceId);

  // =============================================================
  // プロンプト表示領域の開閉制御
  // =============================================================

  const contentId = useId();

  const [internalExpanded, setInternalExpanded] =
    useState(defaultExpanded);

  const isControlled = isExpanded !== undefined;

  const expanded = isControlled
    ? isExpanded
    : internalExpanded;

  function toggleExpanded() {
    const next = !expanded;

    if (!isControlled) {
      setInternalExpanded(next);
    }

    onExpandedChange?.(next);
  }

  // =============================================================
  // 入退室情報
  // =============================================================

  const attendanceItem = useMemo(() => {
    const list = Array.isArray(attendanceData)
      ? attendanceData
      : Array.isArray(attendanceData?.data)
        ? attendanceData.data
        : [];

    return (
      list.find(
        (item) =>
          String(
            item?.children_id ??
            item?.child_id ??
            item?.id ??
            ""
          ) === String(selectedChildId ?? "")
      ) ?? null
    );
  }, [attendanceData, selectedChildId]);

  const selectedChildName =
    selectedSpace?.childName ??
    attendanceItem?.children_name ??
    attendanceItem?.name ??
    "";

  const attendanceEnterText = String(
    attendanceItem?.column5 ?? ""
  ).trim();

  const attendanceLeaveText = String(
    attendanceItem?.column6 ?? ""
  ).trim();

  const isAbsent =
    attendanceEnterText.startsWith("欠席");

  const hasEntered =
    /^\d{1,2}:\d{2}$/.test(attendanceEnterText);

  const hasExited =
    /^\d{1,2}:\d{2}$/.test(attendanceLeaveText);

  const isUIEnabled = Boolean(
    selectedChildId && attendanceItem
  );

  const [text1, setText1] = useState("");
  const [dbNote, setDbNote] = useState("");

  const dispatch = useDispatch();

  // AI入力欄は「日付 + 児童ID + 専門的支援1」で管理する。
  const AI_TEXT_KEY =
    AI_CHAT_TEXT_KEYS.PROFESSIONAL_1;

  const aiText = useSelector(
    selectAiChatText(
      CURRENT_YMD,
      selectedChildId,
      AI_TEXT_KEY
    )
  );

  const logDbg = (field, msg, extra = {}) => {
    void 0;
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
  }, [PROMPTS, promptKey]);

  // =============================================================
  // AI送信文字列
  // =============================================================

  const textValue =
    `${dbNote}\n\n\n${text1}\n\n\n${aiText}`;

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
        spaceId={spaceId}
        defaultTab="notes2"
        displayMode="single"
        noteKey="notes2"
        defaultExpanded={false}
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
          プロンプト（上下開閉対応）
      ===================================================== */}

      <div className="min-w-0">

        {/* 開閉ボタン */}
        <button
          type="button"
          onClick={toggleExpanded}
          aria-expanded={expanded}
          aria-controls={contentId}
          title={
            expanded
              ? "プロンプトを折りたたむ"
              : "プロンプトを展開する"
          }
          className="
            flex items-center gap-1
            rounded px-1 py-0.5
            font-semibold
            transition-colors
            hover:bg-gray-200
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            className={`
              h-4 w-4 shrink-0
              transition-transform duration-200
              motion-reduce:transition-none
              ${expanded ? "rotate-180" : ""}
            `}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>

          <span>
            専門的支援加算用プロンプト
          </span>
        </button>

        {/* テキストエリア開閉領域 */}
        <div
          id={contentId}
          aria-hidden={!expanded}
          className={`
            grid
            transition-[grid-template-rows]
            duration-200 ease-in-out
            motion-reduce:transition-none
            ${
              expanded
                ? "grid-rows-[1fr]"
                : "grid-rows-[0fr]"
            }
          `}
        >
          <div className="min-h-0 min-w-0 overflow-hidden">
            <div className="pt-1">
              <textarea
                aria-label="専門的支援加算用プロンプト"
                tabIndex={expanded ? 0 : -1}
                className="
                  block w-full h-20
                  bg-gray-900 text-white
                  rounded p-2
                "
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
          </div>
        </div>
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
            className="w-[70%] bg-green-500 hover:bg-green-600 p-2 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleSendPrompt}
            disabled={
              !aiText ||
              aiText.trim() === ""
            }
          >
            {aiName}実行
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

        <MemoInputBox
          childId={selectedChildId}
          childName={selectedChildName}
          spaceId={spaceId}
          memoType={2}
          label="一時メモ２（編集可能）"
          minHeight={200}
        />
      </div>
    </div>
  );
}