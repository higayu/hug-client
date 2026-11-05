
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { selectLaravelAuth } from '@/store/slices/authSlice'
import { selectStaffs } from '@/store/slices/databaseSlice'
import { selectCurrentCompanyRole } from '@/store/roleSelectors'

import { useAppState } from '@/AppStateContext'
import { usePrompt } from '@/hooks/usePrompt'
import { useToast } from '@/utils/notifications.jsx'

import {
  DEFAULT_PROMPTS,
  PROMPT_DEFINITIONS,
} from './const'

function PromptTab() {
  const { DATABASE_TYPE, STAFF_ID, updateAppState } = useAppState()

  const auth = useSelector(selectLaravelAuth)
  const staffRows = useSelector(selectStaffs)

  const selectedStaff = staffRows.find(
    (row) => String(row.id) === String(STAFF_ID)
  )

  const authStaffId = auth?.user?.staff_id ?? auth?.user?.id
  const authCompanyId = auth?.user?.company_id
  const selectedCompanyId = selectedStaff?.company_id

  const companyRole = useSelector((state) =>
    authCompanyId == null
      ? null
      : selectCurrentCompanyRole(state, authCompanyId)
  )

  // ログイン職員の会社別ロールを優先する
  const roleCode =
    typeof companyRole === 'string'
      ? companyRole
      : companyRole?.role_code ?? null

  const isGlobalAdmin =
    auth?.user?.role_code === 'admin' ||
    roleCode === 'admin'

  // 会社共有プロンプトを編集できるロール
  const editableCompanyRoles = [
    'admin',
    'mentor',
    'franchise_mentor',
  ]

  const isCompanyManager =
    editableCompanyRoles.includes(roleCode)

  // 会社共有専用項目の表示権限。未認証・ロール未取得時は非表示。
  const canViewCompanyOnly = Boolean(
    auth?.authenticated &&
    (isGlobalAdmin || isCompanyManager)
  )

  const companyOnlyIds = useMemo(() => new Set([50, 51, 100, 150]), [])

  const visibleDefinitions = PROMPT_DEFINITIONS.filter(
    ({ itemId }) => !companyOnlyIds.has(itemId) || canViewCompanyOnly
  )

  const expectedScope =
    Number(selectedStaff?.use_my_prompt) === 1
      ? 'personal'
      : 'company'

  const expectedCompanyId =
    selectedCompanyId ?? authCompanyId

  const getScope = (record, itemId) => {
    if (companyOnlyIds.has(Number(itemId))) return 'company'
    if (record?.companyId != null) return 'company'
    if (record?.staffId != null) return 'personal'

    if (record?.scope === 'company' || record?.scope === 'personal') {
      return record.scope
    }

    return expectedScope
  }

  const isPersonalPrompt =
    expectedScope === 'personal'

  const canEditCompanyPrompt = (record) => {
    if (!auth?.authenticated) return false
    if (!isGlobalAdmin && !isCompanyManager) return false

    const targetCompanyId =
      record?.companyId ?? expectedCompanyId

    if (targetCompanyId == null) return false

    // 全体adminは会社を横断できる
    if (isGlobalAdmin) return true

    // 管理者は所属会社の共有プロンプトのみ編集可能
    return (
      authCompanyId != null &&
      String(authCompanyId) === String(targetCompanyId)
    )
  }

  const canEditPersonalPrompt = (record) => {
    if (!auth?.authenticated) return false
    if (authStaffId == null || STAFF_ID == null) return false

    const targetStaffId =
      record?.staffId ?? STAFF_ID

    return (
      String(authStaffId) === String(STAFF_ID) &&
      String(authStaffId) === String(targetStaffId)
    )
  }

  const canEditRecord = (record, itemId) => {
    const scope = getScope(record, itemId)

    if (scope === 'company') {
      return canEditCompanyPrompt(record)
    }

    if (scope === 'personal') {
      return canEditPersonalPrompt(record)
    }

    return false
  }

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
      // 通常利用用と会社共有編集用を分けて取得する。
      // 会社共有取得は認証済みユーザーの権限をLaravel側で検証する。
      const normalRecords = await getActiveAiPrompts({
        databaseType: DATABASE_TYPE,
      })
      const companyRecords = canViewCompanyOnly
        ? await getActiveAiPrompts({
            databaseType: DATABASE_TYPE,
            scope: 'company',
          })
        : {}
      const nextRecords = { ...(normalRecords ?? {}) }
      for (const { key, itemId } of visibleDefinitions) {
        if (companyOnlyIds.has(itemId)) {
          // 会社共有専用は個人用レコードを流用しない。
          nextRecords[key] = companyRecords?.[key] ?? null
        }
      }
      const nextPrompts = {}

      for (const { key } of visibleDefinitions) {
        nextPrompts[key] = nextRecords[key]?.content ?? ''
      }

      setPromptRecords(nextRecords)
      setPrompts(nextPrompts)
      setSavedPrompts(nextPrompts)

      // 実際のAI実行には通常取得結果だけを渡す。
      // 管理用の別スコープをアプリ全体の実行プロンプトに混ぜない。
      updateAppState({ PROMPTS: normalRecords ?? {} })

      if (showToast) {
        showSuccessToast(
          'データベースからプロンプトを再読み込みしました。'
        )
      }
    } catch (error) {
      console.error('[PromptTab] DB読み込みエラー:', error)

      showErrorToast(
        error?.message || 'プロンプトの取得に失敗しました。'
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    DATABASE_TYPE,
    STAFF_ID,
    getActiveAiPrompts,
    authStaffId,
    companyOnlyIds,
    canViewCompanyOnly,
    showErrorToast,
    showSuccessToast,
    updateAppState,
  ])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  const editablePromptCount = visibleDefinitions.filter(
    ({ key, itemId }) => canEditRecord(promptRecords[key], itemId)
  ).length

  const hasEditablePrompts = editablePromptCount > 0

  const changedDefinitions = visibleDefinitions.filter(
    ({ key }) => prompts[key] !== savedPrompts[key]
  )

  const hasChanges = changedDefinitions.length > 0

  const hasUnauthorizedChanges = changedDefinitions.some(
    ({ key, itemId }) => !canEditRecord(promptRecords[key], itemId)
  )

  /**
   * プロンプトを初期値に戻す。
   * DBへの保存は行わない。
   */
  const handleReset = () => {
    if (isLoading || isSaving || !hasEditablePrompts) return

    setPrompts((previous) => {
      const next = { ...previous }

      for (const { key, itemId } of visibleDefinitions) {
        if (canEditRecord(promptRecords[key], itemId)) {
          next[key] = DEFAULT_PROMPTS[key] ?? ''
        }
      }

      return next
    })

    showSuccessToast(
      '編集可能なプロンプトを初期値に戻しました。保存するとデータベースに反映されます。'
    )
  }

  const handleSave = async () => {
    if (isLoading || isSaving || !hasChanges) return

    setIsSaving(true)

    try {
      if (!auth?.authenticated) {
        throw new Error('ログイン情報を確認できません。')
      }

      if (hasUnauthorizedChanges) {
        throw new Error(
          '編集権限のないプロンプトが含まれています。'
        )
      }

      // 保存時の所有者はプロンプト種別で決定する
      const saveDefinitions = changedDefinitions.map(
        ({ key, itemId }) => {
          const record = promptRecords[key]
          const scope = getScope(record, itemId)

          const targetCompanyId =
            record?.companyId ?? expectedCompanyId

          if (!canEditRecord(record, itemId)) {
            throw new Error(
              `${key} の編集権限がありません。`
            )
          }

          if (scope === 'company' && targetCompanyId == null) {
            throw new Error('対象会社を特定できません。')
          }

          return {
            databaseType: DATABASE_TYPE,
            promptId: record?.promptId ?? null,
            companyId:
              scope === 'company'
                ? targetCompanyId
                : null,
            itemId,
            content: prompts[key],
            isActive: true,
          }
        }
      )

      await Promise.all(
        saveDefinitions.map((payload) =>
          upsertAiPrompt(payload)
        )
      )

      await loadPrompts()

      showSuccessToast(
        'プロンプトをデータベースに保存しました。'
      )
    } catch (error) {
      console.error('[PromptTab] DB保存エラー:', error)

      showErrorToast(
        error?.message ||
          'プロンプトの保存に失敗しました。'
      )
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg text-gray-700">
        AIプロンプト設定
      </h3>

      {canViewCompanyOnly && (
        <p className="mb-3 text-sm text-gray-600">
          50・51・100・150は個人設定に関係なく会社共有です。編集権限はLaravel側でも確認されます。
        </p>
      )}
      {/* 個人用プロンプトの場合のみ表示 */}
      {isPersonalPrompt && (
        <p className="mb-5 text-sm text-gray-600">
          選択中のスタッフのプロンプトをデータベースで管理します。
        </p>
      )}

      {/* 会社共有プロンプトの権限案内 */}
      {!isPersonalPrompt && !isLoading && (
        <p className="mb-5 text-sm text-gray-600">
          {hasEditablePrompts
            ? '会社共有プロンプトを管理します。変更内容は同じ会社の職員に適用されます。'
            : '会社共有プロンプトを表示しています。編集には管理者以上の権限が必要です。'}
        </p>
      )}

      {isLoading ? (
        <p className="py-8 text-center text-gray-500">
          プロンプトを読み込んでいます...
        </p>
      ) : (
        <div className="space-y-5">
          {visibleDefinitions.map(
            ({ key, itemId, label }) => {
              const record = promptRecords[key]
              const scope = getScope(record, itemId)
              const canEdit = canEditRecord(record, itemId)

              return (
                <div key={key}>
                  <label
                    htmlFor={`prompt-${key}`}
                    className="mb-2 block font-semibold text-gray-700"
                  >
                    {label}（item_id: {itemId}）

                    <span className="ml-2 text-xs font-normal text-gray-600">
                      {scope === 'company'
                        ? '会社共有'
                        : scope === 'personal'
                          ? '個人用'
                          : '取得不可'}

                      {!canEdit && '（閲覧のみ）'}
                    </span>
                  </label>

                  <textarea
                    id={`prompt-${key}`}
                    value={prompts[key] ?? ''}
                    onChange={(event) => {
                      if (!canEdit) return

                      setPrompts((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }}
                    rows={5}
                    readOnly={!canEdit}
                    disabled={isSaving}
                    className="w-full resize-y rounded-md border border-gray-300 px-3 py-2 text-sm leading-6 text-gray-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200 read-only:bg-gray-100 disabled:bg-gray-100"
                  />
                </div>
              )
            }
          )}
        </div>
      )}

      <div className="mt-6 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => loadPrompts(true)}
          disabled={isLoading || isSaving}
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
            !hasEditablePrompts
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
            hasUnauthorizedChanges
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
