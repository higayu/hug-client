import { useCallback, useEffect, useState } from 'react'

import { useAppState } from '@/AppStateContext'
import { usePrompt } from '@/hooks/usePrompt'
import { useToast } from '@/provider/ToastProvider/ToastContext'

import {
  DEFAULT_PROMPTS,
  PROMPT_DEFINITIONS,
} from './const'

function PromptTab() {
  const { DATABASE_TYPE, STAFF_ID, updateAppState } = useAppState()
  const { getActiveAiPrompts, upsertAiPrompt } = usePrompt()
  const { showSuccessToast, showErrorToast } = useToast()

  const [prompts, setPrompts] = useState({})
  const [savedPrompts, setSavedPrompts] = useState({})
  const [promptRecords, setPromptRecords] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)

  const loadPrompts = useCallback(async (showToast = false) => {
    setIsLoading(true)

    try {
      if (!STAFF_ID) {
        throw new Error('スタッフを選択してください。')
      }

      const records = await getActiveAiPrompts({
        databaseType: DATABASE_TYPE,
        staffId: STAFF_ID,
      })

      const nextRecords = records ?? {}
      const nextPrompts = {}

      for (const { key } of PROMPT_DEFINITIONS) {
        nextPrompts[key] = nextRecords[key]?.content ?? ''
      }

      setPromptRecords(nextRecords)
      setPrompts(nextPrompts)
      setSavedPrompts(nextPrompts)

      updateAppState({
        PROMPTS: nextRecords,
      })

      if (showToast) {
        showSuccessToast(
          'データベースからプロンプトを再読み込みしました。'
        )
      }
    } catch (error) {
      console.error(
        '[PromptTab] DB読み込みエラー:',
        error
      )

      showErrorToast(
        error?.message ||
          'プロンプトの取得に失敗しました。'
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    DATABASE_TYPE,
    STAFF_ID,
    getActiveAiPrompts,
    showErrorToast,
    showSuccessToast,
    updateAppState,
  ])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  /**
   * プロンプトを初期値に戻す
   *
   * DBにはまだ保存しない。
   * textareaの内容だけ初期値へ変更する。
   */
  const handleReset = () => {
    if (isLoading || isSaving) {
      return
    }

    setPrompts({
      ...DEFAULT_PROMPTS,
    })

    showSuccessToast(
      'プロンプトを初期値に戻しました。保存するとデータベースに反映されます。'
    )
  }

  const handleSave = async () => {
    if (isLoading || isSaving) return

    setIsSaving(true)

    try {
      if (!STAFF_ID) {
        throw new Error('スタッフを選択してください。')
      }

      const changedDefinitions =
        PROMPT_DEFINITIONS.filter(
          ({ key }) =>
            prompts[key] !== savedPrompts[key]
        )

      await Promise.all(
        changedDefinitions.map(
          ({ key, itemId }) =>
            upsertAiPrompt({
              databaseType: DATABASE_TYPE,
              promptId:
                promptRecords[key]?.promptId ??
                null,
              staffId: STAFF_ID,
              itemId,
              content: prompts[key],
              isActive: true,
              updatedBy: STAFF_ID,
            })
        )
      )

      await loadPrompts()

      showSuccessToast(
        'プロンプトをデータベースに保存しました。'
      )
    } catch (error) {
      console.error(
        '[PromptTab] DB保存エラー:',
        error
      )

      showErrorToast(
        error?.message ||
          'プロンプトの保存に失敗しました。'
      )
    } finally {
      setIsSaving(false)
    }
  }

  const hasChanges = PROMPT_DEFINITIONS.some(
    ({ key }) =>
      prompts[key] !== savedPrompts[key]
  )

  return (
    <div>
      <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg text-gray-700">
        AIプロンプト設定
      </h3>

      <p className="mb-5 text-sm text-gray-600">
        選択中のスタッフのプロンプトをデータベースで管理します。
      </p>

      {isLoading ? (
        <p className="py-8 text-center text-gray-500">
          プロンプトを読み込んでいます...
        </p>
      ) : (
        <div className="space-y-5">
          {PROMPT_DEFINITIONS.map(
            ({ key, itemId, label }) => (
              <div key={key}>
                <label
                  htmlFor={`prompt-${key}`}
                  className="mb-2 block font-semibold text-gray-700"
                >
                  {label}（item_id: {itemId}）
                </label>

                <textarea
                  id={`prompt-${key}`}
                  value={prompts[key] ?? ''}
                  onChange={(event) => {
                    setPrompts((previous) => ({
                      ...previous,
                      [key]: event.target.value,
                    }))
                  }}
                  rows={5}
                  disabled={isSaving}
                  className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:bg-gray-100"
                />
              </div>
            )
          )}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => loadPrompts(true)}
          disabled={
            isLoading ||
            isSaving ||
            !STAFF_ID
          }
          className="rounded-md bg-gray-600 px-5 py-2.5 text-white transition-colors hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          再読み込み
        </button>

        <button
          type="button"
          onClick={handleReset}
          disabled={
            isLoading ||
            isSaving ||
            !STAFF_ID
          }
          className="rounded-md bg-amber-600 px-5 py-2.5 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          初期化
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={
            isLoading ||
            isSaving ||
            !hasChanges ||
            !STAFF_ID
          }
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? '保存中...' : '保存'}
        </button>

        {hasChanges && (
          <span className="text-sm text-amber-700">
            未保存の変更があります
          </span>
        )}
      </div>
    </div>
  )
}

export default PromptTab