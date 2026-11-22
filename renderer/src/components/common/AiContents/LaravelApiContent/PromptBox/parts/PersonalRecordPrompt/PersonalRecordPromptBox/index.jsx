import React from "react";

export const DEFAULT_PERSONAL_RECORD_PROMPT_KEY = "personalRecord2";
export const PERSONAL_RECORD_PROMPTS = [
  { key: "personalRecord", label: "通常校正", useDbNote: false },
  { key: "personalRecord2", label: "個別支援計画付き", useDbNote: true },
];
export const getPersonalRecordPromptConfig = (key) =>
  PERSONAL_RECORD_PROMPTS.find((prompt) => prompt.key === key) ??
  PERSONAL_RECORD_PROMPTS.find((prompt) => prompt.key === DEFAULT_PERSONAL_RECORD_PROMPT_KEY);

export default function PersonalRecordPromptBox({
  prompts,
  selectedPromptKey = DEFAULT_PERSONAL_RECORD_PROMPT_KEY,
  onChange,
  disabled = false,
  minHeight = 80,
}) {
  const config = getPersonalRecordPromptConfig(selectedPromptKey);

  return (
    <div className="mt-1">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label htmlFor="personal-record-prompt" className="font-semibold">
          個人記録用プロンプト
        </label>
        <div role="group" aria-label="個人記録の書き方" className="flex rounded-lg border border-gray-300 bg-gray-100 p-0.5">
          {PERSONAL_RECORD_PROMPTS.map((option) => (
            <button
              key={option.key}
              type="button"
              aria-pressed={option.key === selectedPromptKey}
              disabled={disabled}
              onClick={() => onChange?.(option.key)}
              className={`rounded-md px-3 py-1 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                option.key === selectedPromptKey
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-gray-600 hover:bg-white"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <textarea
        id="personal-record-prompt"
        className="w-full border border-gray-300 rounded-lg bg-gray-900 p-2 text-white shadow-sm"
        style={{ minHeight }}
        value={prompts?.[config.key]?.content ?? ""}
        readOnly
      />
      <p className="mt-1 text-xs text-gray-500">
        {config.useDbNote
          ? "保存済みの個別支援計画とプロンプトを使って生成します。計画が未登録の場合は実行できません。"
          : "表示中のプロンプトと入力文章を使って校正します。個別支援計画は使用しません。"}
      </p>
    </div>
  );
}
