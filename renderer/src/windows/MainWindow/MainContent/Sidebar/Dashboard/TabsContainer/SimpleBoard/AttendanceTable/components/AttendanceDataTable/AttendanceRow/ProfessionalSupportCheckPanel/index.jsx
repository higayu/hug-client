import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSelector } from 'react-redux'
import { useAppState } from '@/AppStateContext'
import { useNote } from '@/hooks/useNote'
import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'
import { selectProfessionalSupportStatus } from '@/store/slices/recordStatusSlice.js'
import { useProfessionalSupportCheck2 } from './useProfessionalSupportCheck2'
import ProfessionalSupportListButton from './ProfessionalSupportListButton'
import ProfessionalSupportPostModal from './ProfessionalSupportPostModal'
import { postProfessionalSupportDraft } from './postProfessionalSupportDraft.js'

const PROFESSIONAL_SUPPORT_ID = '55'

const normalizeInterviewDateToYmd = (dateText) => {
  if (!dateText) return null

  const match = String(dateText).match(
    /^(\d{4})年(\d{1,2})月(\d{1,2})日$/,
  )

  if (!match) return null

  const [, year, month, day] = match
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
}

const hasTodayProfessionalSupportRecord = (useDaysResult, currentYmd) => {
  const rows = useDaysResult?.rows ?? []

  return rows.some((row) => {
    const interviewYmd = normalizeInterviewDateToYmd(row.interviewDate)
    return interviewYmd === currentYmd
  })
}

const getRegisteredLabel = (
  registered,
  checking,
  lastUseDaysResult,
  currentYmd,
) => {
  if (checking) return '確認中'
  if (lastUseDaysResult && lastUseDaysResult.ok === false) return '失敗'
  if (registered === true) return '済'
  if (hasTodayProfessionalSupportRecord(lastUseDaysResult, currentYmd)) {
    return '済'
  }
  return '未'
}

async function addProfessionalSupport({ childId, facilityId, dateStr }) {
  if (!childId) throw new Error('児童が選択されていません')
  if (!dateStr) throw new Error('日付が指定されていません')
  if (!facilityId) throw new Error('施設が指定されていません')

  const webview = await getHugWebviewForCache()
  if (!webview) throw new Error('HUG の WebView が見つかりません')

  const script = `
    (async () => {
      const CHILD_ID = ${JSON.stringify(String(childId))};
      const DATE_STR = ${JSON.stringify(String(dateStr))};
      const FACILITY_ID = ${JSON.stringify(String(facilityId))};
      const PROFESSIONAL_SUPPORT_ID = ${JSON.stringify(PROFESSIONAL_SUPPORT_ID)};

      const detailUrl = new URL('https://www.hug-ayumu.link/hug/wm/attendance.php');
      detailUrl.searchParams.set('mode', 'detail');
      detailUrl.searchParams.set('f_id', FACILITY_ID);
      detailUrl.searchParams.set('date', DATE_STR);

      const postUrl = new URL(
        'https://www.hug-ayumu.link/hug/wm/ajax/ajax_adding_contents_2024.php'
      );

      try {
        const detailResponse = await fetch(detailUrl.href, {
          method: 'GET',
          credentials: 'include'
        });

        if (!detailResponse.ok) {
          throw new Error('加算一覧取得失敗 (' + detailResponse.status + ')');
        }

        const html = await detailResponse.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const tbodies = Array.from(doc.querySelectorAll("tbody[id^='js_adding_list']"));

        const targetTbody = tbodies.find((tbody) => {
          const cId = tbody.querySelector('[name="c_id"]')?.value;
          return String(cId || '') === CHILD_ID;
        });

        if (!targetTbody) {
          throw new Error('加算一覧に対象児童が見つかりません: childId=' + CHILD_ID);
        }

        const rowFacilityId = targetTbody.querySelector('[name="f_id"]')?.value || '';
        const resolvedFacilityId = FACILITY_ID || rowFacilityId;
        const hoikuFlg = targetTbody.querySelector('[name="hoiku_flg"]')?.value || '';

        if (!resolvedFacilityId) {
          throw new Error('対象児童の f_id を取得できません');
        }

        const body = new URLSearchParams();
        body.append('adding[selected_content]', PROFESSIONAL_SUPPORT_ID);
        body.append('c_id', CHILD_ID);
        body.append('f_id', resolvedFacilityId);
        body.append('hoiku_flg', hoikuFlg);
        body.append('date', DATE_STR);
        body.append('mode', 'regist');

        const postResponse = await fetch(postUrl.href, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: body.toString(),
          credentials: 'include'
        });

        const responseText = await postResponse.text();

        if (!postResponse.ok) {
          throw new Error(
            '専門的支援加算POST失敗 (' + postResponse.status + '): ' +
            responseText.slice(0, 300)
          );
        }

        return {
          ok: true,
          childId: CHILD_ID,
          facilityId: resolvedFacilityId,
          date: DATE_STR,
          selectedContent: PROFESSIONAL_SUPPORT_ID,
          responseText: responseText.slice(0, 500)
        };
      } catch (error) {
        return {
          ok: false,
          error: error?.message ? String(error.message) : String(error)
        };
      }
    })()
  `

  const result = await webview.executeJavaScript(script)

  if (!result?.ok) {
    throw new Error(result?.error || '専門的支援加算の登録に失敗しました')
  }

  return result
}

async function checkProfessionalSupportRegistration({
  childId,
  facilityId,
  dateStr,
}) {
  if (!childId) throw new Error('児童が選択されていません')
  if (!dateStr) throw new Error('日付が指定されていません')
  if (!facilityId) throw new Error('施設が指定されていません')

  const webview = await getHugWebviewForCache()
  if (!webview) throw new Error('HUG の WebView が見つかりません')

  const script = `
    (async () => {
      const CHILD_ID = ${JSON.stringify(String(childId))};
      const DATE_STR = ${JSON.stringify(String(dateStr))};
      const FACILITY_ID = ${JSON.stringify(String(facilityId))};
      const PROFESSIONAL_SUPPORT_ID = ${JSON.stringify(PROFESSIONAL_SUPPORT_ID)};

      const detailUrl = new URL('https://www.hug-ayumu.link/hug/wm/attendance.php');
      detailUrl.searchParams.set('mode', 'detail');
      detailUrl.searchParams.set('f_id', FACILITY_ID);
      detailUrl.searchParams.set('date', DATE_STR);

      try {
        const response = await fetch(detailUrl.href, {
          method: 'GET',
          credentials: 'include'
        });

        if (!response.ok) {
          throw new Error('出席表取得失敗 (' + response.status + ')');
        }

        const html = await response.text();
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const tbodies = Array.from(doc.querySelectorAll("tbody[id^='js_adding_list']"));

        const targetTbody = tbodies.find((tbody) => {
          const cId = tbody.querySelector('[name="c_id"]')?.value;
          return String(cId || '') === CHILD_ID;
        });

        if (!targetTbody) {
          return {
            ok: true,
            registered: false,
            childFound: false,
            childId: CHILD_ID,
            date: DATE_STR,
            facilityId: FACILITY_ID,
            url: detailUrl.href
          };
        }

        const registrationInput = Array.from(
          targetTbody.querySelectorAll('input[type="hidden"][name]')
        ).find((input) => {
          return input.getAttribute('name') ===
            'adding[][' + PROFESSIONAL_SUPPORT_ID + '][id]';
        });

        const registeredByHiddenId = Boolean(
          registrationInput && String(registrationInput.value || '').trim()
        );

        const registeredByLabel = Array.from(
          targetTbody.querySelectorAll('.js_adding_td b.green, .js_adding_td b')
        ).some((element) =>
          String(element.textContent || '')
            .replace(/\\s+/g, '')
            .includes('専門的支援実施加算')
        );

        return {
          ok: true,
          registered: registeredByHiddenId || registeredByLabel,
          childFound: true,
          childId: CHILD_ID,
          date: DATE_STR,
          facilityId: FACILITY_ID,
          registrationId: registrationInput?.value || null,
          url: detailUrl.href
        };
      } catch (error) {
        return {
          ok: false,
          registered: false,
          error: error?.message ? String(error.message) : String(error)
        };
      }
    })()
  `

  const result = await webview.executeJavaScript(script)

  if (!result?.ok) {
    throw new Error(result?.error || '専門＋の登録状態確認に失敗しました')
  }

  return result
}

/**
 * 専門的支援 統合パネル
 *
 * 閉じた状態:
 * - 専門的支援（下書き保存成功 → 専門＋自動登録）
 * - 保存件数 / 本日ステータス
 * - 入退室時刻が揃わない場合、専門的支援ボタンだけグレースケール
 *
 * 展開状態:
 * - 専門的支援チェック
 * - 専門的支援一覧
 * - 専門＋単体登録
 * - 専門＋登録済み確認
 * - 保存件数 / 本日 / 専門＋の詳細ステータス
 */
export default function ProfessionalSupportCheckPanel({
  className = '',
  logTag = 'SimpleBoardProfessionalSupportCheck',
  currentYmd,
  selectedChildId,
  selectedChildName = '',
  enterTime = '',
  leaveTime = '',
  isAbsent = false,
  hasEntered = false,
  hasExited = false,
  isUIEnabled = true,
  isStop = false,
  loadingAction = null,
  expandDirection = 'up',
}) {
  const menuRef = useRef(null)
  const [isOpen, setIsOpen] = useState(false)
  const [linkedLoading, setLinkedLoading] = useState(false)
  const [plusLoading, setPlusLoading] = useState(false)
  const [registrationCheckLoading, setRegistrationCheckLoading] = useState(false)
  const [plusRegistered, setPlusRegistered] = useState(null)
  const [plusRegistrationId, setPlusRegistrationId] = useState(null)
  const [actionMessage, setActionMessage] = useState('')
  const [actionKind, setActionKind] = useState('idle')
  const [postModalOpen, setPostModalOpen] = useState(false)
  const [postModalError, setPostModalError] = useState('')
  const [postModalInitialContents, setPostModalInitialContents] = useState('')
  const [postModalPreparing, setPostModalPreparing] = useState(false)

  const isExpandDown = expandDirection === 'down'
  const triggerRef = useRef(null)
  const overlayRef = useRef(null)
  const [overlayStyle, setOverlayStyle] = useState(null)

  const arrowRotationClass = isExpandDown
    ? isOpen
      ? 'rotate-180'
      : 'rotate-0'
    : isOpen
      ? 'rotate-0'
      : 'rotate-180'

  const { appState, FACILITY_ID } = useAppState()

  const childId = selectedChildId ? String(selectedChildId) : ''
  const dateStr = currentYmd || ''
  const resolvedFacilityId = FACILITY_ID ?? appState?.FACILITY_ID ?? ''

  const { loadTemp } = useNote()

  const professionalSupportStatus = useSelector((state) =>
    selectProfessionalSupportStatus(state, dateStr, childId),
  )

  const { checking, runCheck } = useProfessionalSupportCheck2(
    logTag,
    childId,
  )

  const useDays = professionalSupportStatus?.useDays ?? null
  const registered = professionalSupportStatus?.registered
  const recordCount = professionalSupportStatus?.recordCount
  const lastUseDaysResult = professionalSupportStatus?.lastUseDaysResult

  const registeredLabel = getRegisteredLabel(
    registered,
    checking,
    lastUseDaysResult,
    dateStr,
  )

  const registeredClass = checking
    ? 'text-gray-300'
    : lastUseDaysResult?.ok === false
      ? 'text-red-300'
      : registered === true ||
          hasTodayProfessionalSupportRecord(lastUseDaysResult, dateStr)
        ? 'text-green-300'
        : 'text-orange-300'

  const useDaysClass =
    useDays == null
      ? 'text-gray-300'
      : useDays >= 2
        ? 'text-sky-300'
        : 'text-red-300'

  // 連動型の「専門的支援」ボタンだけに適用する無効条件。
  // ステータス確認・展開は入退室前でも使える。
  const linkedDisabled =
    !isUIEnabled ||
    isStop ||
    Boolean(loadingAction) ||
    isAbsent ||
    !hasEntered ||
    !hasExited ||
    linkedLoading ||
    plusLoading ||
    !childId ||
    !dateStr ||
    !resolvedFacilityId

  const operationBusy =
    linkedLoading || plusLoading || registrationCheckLoading || checking

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const inTrigger = menuRef.current?.contains(event.target)
      const inOverlay = overlayRef.current?.contains(event.target)
      if (!inTrigger && !inOverlay) setIsOpen(false)
    }

    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  useLayoutEffect(() => {
    if (!isOpen) {
      setOverlayStyle(null)
      return undefined
    }

    const updateOverlayPosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return

      const gap = 4
      const estimatedHeight = overlayRef.current?.offsetHeight || 118
      const top = isExpandDown
        ? rect.bottom + gap
        : Math.max(gap, rect.top - estimatedHeight - gap)

      setOverlayStyle({
        position: 'fixed',
        top: `${top}px`,
        left: `${rect.left}px`,
        width: `${rect.width}px`,
        zIndex: 9999,
      })
    }

    updateOverlayPosition()
    const raf = requestAnimationFrame(updateOverlayPosition)
    window.addEventListener('resize', updateOverlayPosition)
    window.addEventListener('scroll', updateOverlayPosition, true)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', updateOverlayPosition)
      window.removeEventListener('scroll', updateOverlayPosition, true)
    }
  }, [isOpen, isExpandDown])

  const setAction = (kind, message) => {
    setActionKind(kind)
    setActionMessage(message)
  }

  const runStatusCheck = async () => {
    if (checking) return

    try {
      await runCheck()
    } catch (error) {
      console.error('[SimpleBoard/ProfessionalSupportCheckPanel] check error:', error)
    }
  }

  const runProfessionalPlusRegistrationCheck = async ({ force = false } = {}) => {
    if (
      (!force && operationBusy) ||
      registrationCheckLoading ||
      !childId ||
      !dateStr ||
      !resolvedFacilityId
    ) {
      return
    }

    setRegistrationCheckLoading(true)
    setAction('working', '専門＋ 登録確認中')

    try {
      const result = await checkProfessionalSupportRegistration({
        childId,
        facilityId: resolvedFacilityId,
        dateStr,
      })

      setPlusRegistered(result.registered === true)
      setPlusRegistrationId(result.registrationId || null)

      if (!result.childFound) {
        setAction('warning', '対象児童が出席表に見つかりません')
      } else if (result.registered === true) {
        setAction(
          'success',
          result.registrationId
            ? `専門＋ 登録済み ID:${result.registrationId}`
            : '専門＋ 登録済み',
        )
      } else {
        setAction('warning', '専門＋ 未登録')
      }

      return result
    } catch (error) {
      console.error('[SimpleBoard/ProfessionalSupportCheckPanel] registration check:', error)
      setPlusRegistered(null)
      setPlusRegistrationId(null)
      setAction('error', `確認失敗: ${error?.message || error}`)
      return { ok: false, error: error?.message || String(error) }
    } finally {
      setRegistrationCheckLoading(false)
    }
  }

  const runProfessionalPlusOnly = async () => {
    if (operationBusy || !childId || !dateStr || !resolvedFacilityId) return

    setPlusLoading(true)
    setAction('working', '専門＋ 登録中')

    try {
      const result = await addProfessionalSupport({
        childId,
        facilityId: resolvedFacilityId,
        dateStr,
      })

      setPlusRegistered(true)
      setAction('success', '専門＋ 登録OK')
      await runProfessionalPlusRegistrationCheck({ force: true })
      return result
    } catch (error) {
      console.error('[SimpleBoard/ProfessionalSupportCheckPanel] plus error:', error)
      setAction('error', `失敗: ${error?.message || error}`)
      return { ok: false, error: error?.message || String(error) }
    } finally {
      setPlusLoading(false)
    }
  }

  const openLinkedModal = async () => {
    if (linkedDisabled || postModalPreparing) return

    setPostModalError('')
    setPostModalPreparing(true)
    setAction('working', '一時メモ2 読込中')

    try {
      let loadedNote = { memo1: '', memo2: '' }

      const proxy = {
        get value() {
          return loadedNote
        },
        set value(nextValue) {
          loadedNote = nextValue || { memo1: '', memo2: '' }
        },
      }

      await loadTemp(childId, proxy)

      setPostModalInitialContents(loadedNote?.memo2 || '')
      setPostModalOpen(true)
      setAction('idle', '')
    } catch (error) {
      console.error('[SimpleBoard/ProfessionalSupportCheckPanel] temp memo2 load error:', error)
      setPostModalInitialContents('')
      setPostModalOpen(true)
      setPostModalError(
        `一時メモ2の読込に失敗しました: ${error?.message || error}`,
      )
      setAction('warning', '一時メモ2 読込失敗')
    } finally {
      setPostModalPreparing(false)
    }
  }

  const closeLinkedModal = () => {
    if (linkedLoading) return
    setPostModalOpen(false)
    setPostModalError('')
  }

  const runLinked = async ({
    dateStr: modalDateStr,
    startTime,
    endTime,
    title,
    contents,
  }) => {
    if (linkedDisabled) return

    setLinkedLoading(true)
    setPostModalError('')
    setAction('working', '専門的支援 下書きPOST中')

    try {
      const supportResult = await postProfessionalSupportDraft({
        childId,
        facilityId: resolvedFacilityId,
        dateStr: modalDateStr || dateStr,
        startTime,
        endTime,
        staffId: appState?.STAFF_ID,
        title,
        contents,
      })

      if (!supportResult?.ok || supportResult?.saved !== true) {
        throw new Error(
          supportResult?.error || '専門的支援の下書き保存に失敗しました',
        )
      }

      setAction('working', '下書きOK → 専門＋登録中')

      const plusResult = await addProfessionalSupport({
        childId,
        facilityId: resolvedFacilityId,
        dateStr: modalDateStr || dateStr,
      })

      setPlusRegistered(true)
      setPostModalOpen(false)
      setAction('success', '連動OK')

      await runProfessionalPlusRegistrationCheck({ force: true })
      await runStatusCheck()

      return {
        ok: true,
        saved: true,
        linked: true,
        supportResult,
        plusResult,
      }
    } catch (error) {
      console.error('[SimpleBoard/ProfessionalSupportCheckPanel] linked error:', error)
      const message = error?.message || String(error)
      setPostModalError(message)
      setAction('error', `失敗: ${message}`)
      return { ok: false, linked: false, error: message }
    } finally {
      setLinkedLoading(false)
    }
  }

  const getLinkedTitle = () => {
    if (isAbsent) return '欠席のため専門的支援は使用できません'
    if (!hasEntered) return '入室後・退室後に使用できます'
    if (!hasExited) return '退室後に使用できます'
    if (!isUIEnabled || isStop) return '現在操作できません'
    if (loadingAction) return '他の処理中のため使用できません'
    if (!childId) return '児童が選択されていません'
    if (!dateStr) return '日付が指定されていません'
    if (!resolvedFacilityId) return '施設が指定されていません'
    return '入力モーダルを開き、下書きをPOSTした後に専門＋を自動登録します'
  }

  const actionClass = {
    idle: 'text-gray-400',
    working: 'text-sky-300',
    success: 'text-green-300',
    warning: 'text-orange-300',
    error: 'text-red-300',
  }[actionKind] || 'text-gray-400'

  const plusStatusLabel = registrationCheckLoading
    ? '確認中'
    : plusRegistered === true
      ? plusRegistrationId
        ? `登録済み ID:${plusRegistrationId}`
        : '登録済み'
      : plusRegistered === false
        ? '未登録'
        : '未確認'

  const plusStatusClass = registrationCheckLoading
    ? 'text-sky-300'
    : plusRegistered === true
      ? 'text-green-300'
      : plusRegistered === false
        ? 'text-orange-300'
        : 'text-gray-300'

  return (
    <div
      ref={menuRef}
      className={`relative mt-1 flex w-full flex-col ${isOpen ? 'z-[120]' : 'z-0'} ${className}`.trim()}
    >
      {/* 展開エリア: body直下に浮かせるため、閉じても余白を確保しない */}
      {isOpen && overlayStyle
        ? createPortal(
            <div
              ref={overlayRef}
              style={overlayStyle}
              className="rounded-md bg-gray-900 p-1.5 shadow-xl"
            >
        <div className="grid grid-cols-2 gap-1">
          <button
            type="button"
            onClick={runStatusCheck}
            disabled={checking || !childId || !dateStr}
            className="flex h-8 items-center justify-center rounded bg-purple-600 px-2 text-xs font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
            title="専門的支援の保存件数と本日の登録状況を確認"
          >
            {checking ? '確認中...' : '専門チェック'}
          </button>

          <ProfessionalSupportListButton
            className="flex h-8 items-center justify-center rounded bg-gray-100 px-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-200 disabled:opacity-50"
            selectedChildId={childId}
            selectedChildName={selectedChildName}
          />

          <button
            type="button"
            onClick={runProfessionalPlusOnly}
            disabled={operationBusy || !childId || !dateStr || !resolvedFacilityId}
            className="flex h-8 items-center justify-center rounded bg-red-600 px-2 text-xs font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            title="専門＋だけを登録"
          >
            {plusLoading ? '登録中...' : '専門＋'}
          </button>

          <button
            type="button"
            onClick={() => runProfessionalPlusRegistrationCheck()}
            disabled={
              operationBusy || !childId || !dateStr || !resolvedFacilityId
            }
            className={`flex h-8 items-center justify-center rounded px-2 text-xs font-semibold text-white transition disabled:opacity-50 ${
              plusRegistered === true
                ? 'bg-green-600 hover:bg-green-700'
                : plusRegistered === false
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-slate-600 hover:bg-slate-700'
            }`}
            title={`登録確認 / f_id=${resolvedFacilityId || '-'} / date=${dateStr || '-'}`}
          >
            {registrationCheckLoading
              ? '確認中...'
              : plusRegistered === true
                ? '登録済み'
                : plusRegistered === false
                  ? '未登録'
                  : '登録確認'}
          </button>
        </div>

        {/* 展開時ステータス */}
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 rounded bg-gray-800 px-2 py-1 text-[11px]">
          <span className="text-gray-300">
            保存 <b className={useDaysClass}>{useDays != null ? `${useDays}個` : '未'}</b>
          </span>
          <span className="text-gray-300">
            本日 <b className={registeredClass}>{registeredLabel}</b>
            {recordCount != null ? ` (${recordCount}件)` : ''}
          </span>
          <span className={plusStatusClass}>専門＋ {plusStatusLabel}</span>
          {actionMessage ? (
            <span className={`min-w-0 truncate ${actionClass}`}>{actionMessage}</span>
          ) : null}
        </div>
            </div>,
            document.body,
          )
        : null}

      {/* 閉じた状態 */}
      <div
        ref={triggerRef}
        className="order-1 flex h-10 w-full items-stretch overflow-hidden rounded bg-gray-900 shadow-sm"
      >
        <button
          type="button"
          onClick={openLinkedModal}
          disabled={linkedDisabled || postModalPreparing}
          title={getLinkedTitle()}
          className={`shrink-0 px-3 text-xs font-semibold text-white transition ${
            linkedDisabled
              ? 'cursor-not-allowed bg-gray-500 grayscale opacity-60'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {linkedLoading ? '連動中...' : '専門的支援'}
        </button>

        <button
          type="button"
          onClick={runStatusCheck}
          disabled={checking || !childId || !dateStr}
          className="flex min-w-0 flex-1 items-center gap-2 px-2 text-xs transition hover:bg-gray-800 disabled:cursor-not-allowed"
          title={`保存件数: ${useDays != null ? `${useDays}個` : '未取得'} / 本日: ${registeredLabel}`}
        >
          <span className="flex shrink-0 items-center gap-1 text-gray-300">
            <span>保存</span>
            <span className={`font-bold ${useDaysClass}`}>
              {useDays != null ? `${useDays}個` : '未'}
            </span>
          </span>

          <span className="h-4 w-px shrink-0 bg-gray-600" aria-hidden="true" />

          <span className="flex shrink-0 items-center gap-1 text-gray-300">
            <span>本日</span>
            <span className={`font-bold ${registeredClass}`}>
              {registeredLabel}
            </span>
          </span>

          {actionMessage ? (
            <span className={`min-w-0 truncate ${actionClass}`}>
              {actionMessage}
            </span>
          ) : null}
        </button>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-expanded={isOpen}
          aria-label={isOpen ? '専門的支援メニューを閉じる' : '専門的支援メニューを開く'}
          className="flex w-8 shrink-0 items-center justify-center bg-gray-800 text-gray-300 transition hover:bg-gray-700"
          title="専門的支援メニュー"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 transition-transform duration-200 ${arrowRotationClass}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
          </svg>
        </button>
      </div>

      <ProfessionalSupportPostModal
        open={postModalOpen}
        submitting={linkedLoading}
        childName={selectedChildName || ''}
        childId={childId}
        facilityId={resolvedFacilityId}
        initialDate={dateStr}
        initialStartTime={enterTime || ''}
        initialEndTime={leaveTime || ''}
        initialContents={postModalInitialContents}
        errorMessage={postModalError}
        onCancel={closeLinkedModal}
        onSubmit={runLinked}
      />
    </div>
  )
}
