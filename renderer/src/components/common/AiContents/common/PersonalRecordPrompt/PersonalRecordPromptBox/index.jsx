import React, { useId, useState } from "react";

export const DEFAULT_PERSONAL_RECORD_PROMPT_KEY = "personalRecord2";

export const PERSONAL_RECORD_PROMPTS = [
  {
    key: "personalRecord",
    label: "通常校正",
    useDbNote: false,
  },
  {
    key: "personalRecord2",
    label: "個別支援計画付き",
    useDbNote: true,
  },
];

export const getPersonalRecordPromptConfig = (key) => {
  return (
    PERSONAL_RECORD_PROMPTS.find(
      (prompt) => prompt.key === key
    ) ??
    PERSONAL_RECORD_PROMPTS.find(
      (prompt) =>
        prompt.key === DEFAULT_PERSONAL_RECORD_PROMPT_KEY
    )
  );
};

export default function PersonalRecordPromptBox({
  prompts,
  selectedPromptKey = DEFAULT_PERSONAL_RECORD_PROMPT_KEY,
  onChange,
  minHeight = 80,

  // 開閉制御
  isExpanded,
  defaultExpanded = false,
  onExpandedChange,
}) {
  const contentId = useId();
  const textareaId = `${contentId}-textarea`;

  // ========================================
  // 開閉状態の管理
  // ========================================

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

  // ========================================
  // 選択中のプロンプト
  // ========================================

  const selectedPrompt =
    prompts?.[selectedPromptKey]?.content ?? "";

  return (
    <div className="mt-1">

      {/* ヘッダー：常に表示 */}
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">

        {/* プロンプト開閉ボタン */}
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
              ${expanded ? "rotate-180" : ""}
            `}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>

          <span>個人記録用プロンプト</span>
        </button>

        {/* プロンプト切り替えボタン */}
        <div
          className="
            flex rounded-lg
            border border-gray-300
            bg-gray-100 p-0.5
          "
          role="group"
          aria-label="個人記録の書き方"
        >
          {PERSONAL_RECORD_PROMPTS.map((prompt) => {
            const selected =
              prompt.key === selectedPromptKey;

            return (
              <button
                key={prompt.key}
                type="button"
                aria-pressed={selected}
                onClick={() => onChange(prompt.key)}
                className={`
                  rounded-md px-3 py-1
                  text-xs font-bold
                  transition-colors
                  ${
                    selected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-white"
                  }
                `}
              >
                {prompt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* テキストエリア：上下開閉領域 */}
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
          <textarea
            id={textareaId}
            aria-label="個人記録用プロンプト"
            tabIndex={expanded ? 0 : -1}
            className="
              block w-full
              rounded-lg border border-gray-300
              bg-gray-900 p-2
              text-white shadow-sm
              focus:outline-none
              focus:ring-2
              focus:ring-indigo-500
            "
            style={{
              minHeight,
            }}
            value={selectedPrompt}
            readOnly
          />
        </div>
      </div>
    </div>
  );
}