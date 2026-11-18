import React from "react";

// Laravel APIの個人記録は、個別支援計画付き（DB item_id=4）だけを使用する。
export const DEFAULT_PERSONAL_RECORD_PROMPT_KEY = "personalRecord2";
export const PERSONAL_RECORD_PROMPTS = [
  { key: DEFAULT_PERSONAL_RECORD_PROMPT_KEY, label: "個人記録（個別支援計画付き）", useDbNote: true },
];
export const getPersonalRecordPromptConfig = () => PERSONAL_RECORD_PROMPTS[0];

export default function PersonalRecordPromptBox({ prompts, minHeight = 80 }) {
  return (
    <div className="mt-1">
      <label htmlFor="personal-record-prompt" className="mb-1 block font-semibold">
        個人記録用プロンプト（個別支援計画付き）
      </label>
      <textarea
        id="personal-record-prompt"
        className="w-full border border-gray-300 rounded-lg bg-gray-900 p-2 text-white shadow-sm"
        style={{ minHeight }}
        value={prompts?.[DEFAULT_PERSONAL_RECORD_PROMPT_KEY]?.content ?? ""}
        readOnly
      />
      <p className="mt-1 text-xs text-gray-500">
        実行時にLaravelが保存済みの個別支援計画とプロンプトを取得します。計画が未登録の場合は実行できません。
      </p>
    </div>
  );
}