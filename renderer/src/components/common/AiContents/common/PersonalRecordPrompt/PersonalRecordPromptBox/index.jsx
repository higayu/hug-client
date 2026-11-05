import React from "react";

export const PERSONAL_RECORD_PROMPTS = [
  {
    key: "personalRecord",
    label: "個人記録1",
    useDbNote: false,
  },
  {
    key: "personalRecord2",
    label: "個人記録2",
    useDbNote: true,
  },
];

export const getPersonalRecordPromptConfig = (
  key
) => {
  return (
    PERSONAL_RECORD_PROMPTS.find(
      (prompt) =>
        prompt.key === key
    ) ?? {
      key,
      label: key,
      useDbNote: false,
    }
  );
};

export default function PersonalRecordPromptBox({
  prompts,
  selectedPromptKey,
  onChange,
  minHeight = 80,
}) {
  const selectedPrompt =
    prompts?.[selectedPromptKey]
      ?.content ?? "";

  return (
    <div className="mt-1">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <label
          htmlFor="personal-record-prompt"
          className="font-semibold"
        >
          個人記録用プロンプト
        </label>

        <div
          className="flex rounded-lg border border-gray-300 bg-gray-100 p-0.5"
          role="group"
          aria-label="個人記録用プロンプトの切替"
        >
          {PERSONAL_RECORD_PROMPTS.map(
            (prompt) => {
              const selected =
                prompt.key ===
                selectedPromptKey;

              return (
                <button
                  key={prompt.key}
                  type="button"
                  aria-pressed={
                    selected
                  }
                  onClick={() =>
                    onChange(
                      prompt.key
                    )
                  }
                  className={`rounded-md px-3 py-1 text-xs font-bold transition-colors ${
                    selected
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  {prompt.label}
                </button>
              );
            }
          )}
        </div>
      </div>

      <textarea
        id="personal-record-prompt"
        className="w-full border border-gray-300 rounded-lg bg-gray-900 p-2 text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        style={{
          minHeight,
        }}
        value={selectedPrompt}
        readOnly
      />
    </div>
  );
}