import React from 'react'

/**
 * プロンプトの種類ごとに編集欄をまとめる表示用コンテナ。
 * 権限判定・保存処理は親のPromptTabで管理する。
 */
export default function PromptSection({ title, description, count, children }) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="text-base font-bold text-gray-800">{title}</h4>
          <span className="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-xs text-gray-600">
            {count}項目
          </span>
        </div>
        {description && <p className="mt-1 text-sm leading-6 text-gray-600">{description}</p>}
      </div>
      <div className="space-y-5 px-4 py-4 sm:px-5 sm:py-5">{children}</div>
    </section>
  )
}
