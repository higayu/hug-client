
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import PromptSection from './PromptSection'
import PromptHistoryPanel from './PromptHistoryPanel'
import { restorePromptHistory } from '@/hooks/usePrompt/history'

function PromptTab() {
  const { DATABASE_TYPE, STAFF_ID, PROMPTS: activePrompts, updateAppState } = useAppState()

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

  // 現在使用していないプロンプトは管理画面に表示しない
  const hiddenPromptIds = useMemo(() => new Set([3, 150]), [])

  const visibleDefinitions = PROMPT_DEFINITIONS.filter(
    ({ itemId }) =>
      !hiddenPromptIds.has(Number(itemId)) &&
      (!companyOnlyIds.has(Number(itemId)) || canViewCompanyOnly)
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
  const loadSequence = useRef(0)

  const loadPrompts = useCallback(async (showToast = false) => {
    const sequence = ++loadSequence.current
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

      if (sequence !== loadSequence.current) return
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
      if (sequence !== loadSequence.current) return
      console.error('[PromptTab] DB読み込みエラー:', error)

      showErrorToast(
        error?.message || 'プロンプトの取得に失敗しました。'
      )
    } finally {
      if (sequence === loadSequence.current) setIsLoading(false)
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
    return () => { loadSequence.current++ }
  }, [loadPrompts])

  const personalAllowedDefinitions = visibleDefinitions.filter(
    ({ itemId }) => !companyOnlyIds.has(itemId)
  )
  const companyOnlyDefinitions = visibleDefinitions.filter(
    ({ itemId }) => companyOnlyIds.has(itemId)
  )
  const hasEditableBasicPrompts = personalAllowedDefinitions.some(
    ({ key, itemId }) => canEditRecord(promptRecords[key], itemId)
  )

  const changedDefinitions = visibleDefinitions.filter(
    ({ key }) => prompts[key] !== savedPrompts[key]
  )

  const hasChanges = changedDefinitions.length > 0

  const hasUnauthorizedChanges = changedDefinitions.some(
    ({ key, itemId }) => !canEditRecord(promptRecords[key], itemId)
  )

  /**
   * 基本プロンプトだけを初期値に戻す。会社共有専用項目は対象外。
   * DBへの保存は行わない。
   */
  const handleReset = () => {
    if (isLoading || isSaving || !hasEditableBasicPrompts) return

    setPrompts((previous) => {
      const next = { ...previous }

      for (const { key, itemId } of personalAllowedDefinitions) {
        if (canEditRecord(promptRecords[key], itemId)) {
          next[key] = DEFAULT_PROMPTS[key] ?? ''
        }
      }

      return next
    })

    showSuccessToast(
      '編集可能な基本プロンプトを初期値に戻しました。保存するとデータベースに反映されます。'
    )
  }

  // Only update the saved prompt; other editors may still contain unsaved drafts.
  const applySavedVersions = (entries) => {
    const records = {}
    const texts = {}
    const activeUpdates = {}
    for (const { key, row, content } of entries) {
      const record = {
        ...promptRecords[key],
        success: true,
        promptId: row.prompt_id,
        companyId: row.company_id ?? null,
        staffId: row.staff_id ?? null,
        itemId: row.item_id,
        scope: row.company_id != null ? 'company' : 'personal',
        currentHistoryId: row.current_history_id,
        version: row.version,
        content,
      }
      records[key] = record
      texts[key] = content
      if (!activePrompts?.[key] || String(activePrompts[key].promptId) === String(row.prompt_id)) {
        activeUpdates[key] = record
      }
    }
    setPromptRecords((previous) => ({ ...previous, ...records }))
    setPrompts((previous) => ({ ...previous, ...texts }))
    setSavedPrompts((previous) => ({ ...previous, ...texts }))
    if (Object.keys(activeUpdates).length) updateAppState({ PROMPTS: { ...activePrompts, ...activeUpdates } })
  }

  const handleRestore = async (key, itemId, historyId, expectedHistoryId) => {
    if (isSaving || isLoading) throw new Error('処理が完了してから操作してください。')
    const record = promptRecords[key]
    if (!canEditRecord(record, itemId)) throw new Error('復元する権限がありません。')
    const sequence = loadSequence.current
    setIsSaving(true)
    try {
      const row = await restorePromptHistory({ promptId: record.promptId, historyId, expectedHistoryId })
      if (sequence === loadSequence.current) {
        applySavedVersions([{ key, row, content: row.content }])
        showSuccessToast(`選択した内容を復元しました（使用中: Ver.${row.version}）。`)
      }
    } finally {
      setIsSaving(false)
    }
  }

  const handleSave = async () => {
    if (isLoading || isSaving || !hasChanges) return

    const sequence = loadSequence.current
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
            key,
            databaseType: DATABASE_TYPE,
            promptId: record?.promptId ?? null,
            expectedHistoryId: record?.currentHistoryId,
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

      const results = await Promise.allSettled(saveDefinitions.map((payload) => upsertAiPrompt(payload)))
      if (sequence !== loadSequence.current) return
      const saved = []
      const failures = []
      results.forEach((result, index) => {
        const definition = saveDefinitions[index]
        if (result.status === 'fulfilled') {
          const row = Array.isArray(result.value) ? result.value[0] : result.value
          if (row?.prompt_id && row?.current_history_id) saved.push({ key: definition.key, content: definition.content, row })
          else failures.push('保存結果のバージョンを確認できません。再読み込みしてください。')
        } else {
          failures.push(result.reason?.message || '保存に失敗しました。')
        }
      })
      if (saved.length) applySavedVersions(saved)
      if (failures.length) throw new Error(`${saved.length ? `${saved.length}件は保存済みです。` : ''}${failures.join(' ')}`)
      showSuccessToast('変更したプロンプトをバージョン履歴に保存しました。')
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

  const renderPromptEditor = ({ key, itemId, label }) => {
    const record = promptRecords[key]
    const scope = getScope(record, itemId)
    const canEdit = canEditRecord(record, itemId)

    return (
      <div key={key}>
        <label
          htmlFor={`prompt-${key}`}
          className="mb-2 block font-semibold text-gray-700"
        >
          {label}
          {Number(itemId) === 51 && (
            <span className="mr-2 text-red-600">
              （※個別支援計画とF-SOAIPの使用）
            </span>
          )}
          （item_id: {itemId}）
          {record?.version != null && <span className="ml-2 text-xs text-indigo-700">使用中: Ver.{record.version}</span>}
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
        {record?.promptId && auth?.authenticated && String(DATABASE_TYPE).toLowerCase() === 'laravel' ? (
          <PromptHistoryPanel
            key={`${authStaffId}:${record.promptId}`}
            promptId={record.promptId}
            currentHistoryId={record.currentHistoryId}
            canEdit={canEdit}
            disabled={isSaving || isLoading}
            hasDraft={prompts[key] !== savedPrompts[key]}
            onUseContent={(content) => {
              if (canEdit && !isSaving) setPrompts((previous) => ({ ...previous, [key]: content }))
            }}
            onRestore={(historyId, expectedHistoryId) => handleRestore(key, itemId, historyId, expectedHistoryId)}
          />
        ) : !record?.promptId && canEdit ? <p className="mt-1 text-xs text-gray-500">初回保存後にバージョン履歴を利用できます。</p> : null}
      </div>
    )
  }

  return (
    <div>
      <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg text-gray-700">
        AIプロンプト設定
      </h3>

      {isLoading ? (
        <p className="py-8 text-center text-gray-500">
          プロンプトを読み込んでいます...
        </p>
      ) : (
        <div className="space-y-6">
          <PromptSection
            title="基本プロンプト"
            description={isPersonalPrompt
              ? '選択中のスタッフの個人用プロンプトを表示しています。'
              : '会社共有プロンプトを表示しています。会社共有の編集には権限が必要です。'}
            count={personalAllowedDefinitions.length}
            actions={(
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={
                    isLoading ||
                    isSaving ||
                    !hasEditableBasicPrompts
                  }
                  className="rounded-md bg-amber-600 px-5 py-2.5 text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  基本プロンプトを初期化
                </button>
            )}
          >
            {personalAllowedDefinitions.map(renderPromptEditor)}
          </PromptSection>

          {canViewCompanyOnly && (
            <PromptSection
              title="会社共有専用プロンプト"
              description="個人設定に関係なく会社共有で管理するプロンプトです。編集権限はLaravel側でも確認されます。"
              count={companyOnlyDefinitions.length}
            >
              {companyOnlyDefinitions.map(renderPromptEditor)}
            </PromptSection>
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
