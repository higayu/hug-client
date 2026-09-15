import { useCallback } from 'react'
import { useSelector } from 'react-redux'

import { useAppState } from '@/AppStateContext'
import { useTabs } from '@/hooks/useTabs'
import {
  createWebview,
  createTabButton,
} from '@/hooks/useTabs/common/index.js'
import {
  selectActiveSpaceId,
  selectSpace,
} from '@/store/slices/chilledspaceSlice.js'
import { confirmDialog } from '@/utils/dialog/confirmDialog.js'

const HUG_ATTENDANCE_URL = 'https://www.hug-ayumu.link/hug/wm/attendance.php'
const TAB_LABEL = 'キャンセル待ちの登録'

/**
 * HUG のキャンセル待ち登録画面で対象児童を選択する。
 *
 * HUG 側のDOM差異にある程度耐えられるように、
 * select / radio / checkbox / hidden を児童IDで探索する。
 */
async function selectChildInWaitingListPage(webview, childId) {
  if (!webview || typeof webview.executeJavaScript !== 'function') {
    return false
  }

  const targetChildId = String(childId ?? '')

  if (!targetChildId) {
    return false
  }

  const script = `
    (() => {
      const TARGET_CHILD_ID = ${JSON.stringify(targetChildId)};

      const dispatchChangeEvents = (element) => {
        element.dispatchEvent(new Event('input', { bubbles: true }));
        element.dispatchEvent(new Event('change', { bubbles: true }));
      };

      const isChildFieldName = (name) => {
        const value = String(name || '').toLowerCase();

        return (
          value === 'c_id' ||
          value === 'child_id' ||
          value === 'children_id' ||
          value.includes('c_id') ||
          value.includes('child') ||
          value.includes('children')
        );
      };

      // 1. select 要素
      const selects = Array.from(document.querySelectorAll('select'));

      for (const select of selects) {
        const name = select.getAttribute('name') || '';
        const id = select.id || '';
        const hasTargetOption = Array.from(select.options || []).some(
          (option) => String(option.value) === TARGET_CHILD_ID
        );

        if (
          hasTargetOption &&
          (isChildFieldName(name) || isChildFieldName(id) || selects.length === 1)
        ) {
          select.value = TARGET_CHILD_ID;
          dispatchChangeEvents(select);

          return {
            success: true,
            type: 'select',
            name,
            id,
          };
        }
      }

      // 2. radio / checkbox
      const checkables = Array.from(
        document.querySelectorAll('input[type="radio"], input[type="checkbox"]')
      );

      for (const input of checkables) {
        const value = String(input.value ?? '');
        const name = input.getAttribute('name') || '';
        const id = input.id || '';

        if (
          value === TARGET_CHILD_ID &&
          (isChildFieldName(name) || isChildFieldName(id))
        ) {
          input.checked = true;
          dispatchChangeEvents(input);
          input.click?.();

          return {
            success: true,
            type: input.type,
            name,
            id,
          };
        }
      }

      // 3. hidden / text 系の児童IDフィールド
      const inputs = Array.from(document.querySelectorAll('input'));

      for (const input of inputs) {
        const name = input.getAttribute('name') || '';
        const id = input.id || '';

        if (!isChildFieldName(name) && !isChildFieldName(id)) {
          continue;
        }

        if (String(input.value ?? '') === TARGET_CHILD_ID) {
          // 同一行・同一ブロックに選択用 checkbox/radio があればそちらもONにする。
          const container =
            input.closest('tr, li, .row, .form-group, .card, div') ||
            input.parentElement;

          const selectable = container?.querySelector?.(
            'input[type="radio"], input[type="checkbox"]'
          );

          if (selectable) {
            selectable.checked = true;
            dispatchChangeEvents(selectable);
            selectable.click?.();
          }

          return {
            success: true,
            type: input.type || 'input',
            name,
            id,
            linkedSelectable: Boolean(selectable),
          };
        }
      }

      console.warn(
        '[WaitingListRegistration] HUG画面で対象児童を見つけられませんでした',
        {
          childId: TARGET_CHILD_ID,
          url: location.href,
        }
      );

      return {
        success: false,
        reason: 'child-not-found',
      };
    })();
  `

  try {
    const result = await webview.executeJavaScript(script)

    if (!result?.success) {
      console.warn(
        '[WaitingListRegistration] 児童自動選択に失敗しました',
        result,
      )
      return false
    }

    console.log(
      '[WaitingListRegistration] 児童を自動選択しました',
      result,
    )

    return true
  } catch (error) {
    console.error(
      '[WaitingListRegistration] 児童自動選択処理でエラー',
      error,
    )
    return false
  }
}

export default function WaitingListRegistration({
  spaceId,
  disabled = false,
  label = 'キャンセル待ちの登録',
  className = '',
}) {
  const { appState } = useAppState()
  const { activateTab, closeTab } = useTabs()

  const activeSpaceId = useSelector(selectActiveSpaceId)
  const effectiveSpaceId = spaceId || activeSpaceId
  const space = useSelector(selectSpace(effectiveSpaceId))

  const childId = space?.childId ?? ''
  const childName = space?.childName ?? ''

  const handleClick = useCallback(() => {
    if (!effectiveSpaceId) {
      console.error(
        '[WaitingListRegistration] spaceId を取得できません',
      )
      return
    }

    if (!childId) {
      console.warn(
        '[WaitingListRegistration] 選択児童IDを取得できません',
        {
          effectiveSpaceId,
          space,
        },
      )
      return
    }

    const targetDate = appState?.CURRENT_YMD
    const facilityId = appState?.FACILITY_ID

    if (!targetDate) {
      console.error(
        '[WaitingListRegistration] CURRENT_YMD を取得できません',
      )
      return
    }

    if (!facilityId) {
      console.error(
        '[WaitingListRegistration] FACILITY_ID を取得できません',
      )
      return
    }

    const tabsContainer = document.getElementById('tabs')
    const webviewContainer = document.getElementById('webview-container')

    if (!tabsContainer || !webviewContainer) {
      console.error(
        '[WaitingListRegistration] tabs または webview-container が見つかりません',
      )
      return
    }

    const url = new URL(HUG_ATTENDANCE_URL)
    url.searchParams.set('mode', 'add')
    url.searchParams.set('date', String(targetDate))
    url.searchParams.set('f_id', String(facilityId))

    const newId =
      `waiting-list-${Date.now()}-${document.querySelectorAll('webview').length}`

    const newWebview = createWebview(
      newId,
      url.toString(),
    )

    webviewContainer.appendChild(newWebview)

    const tabLabel = childName
      ? `${TAB_LABEL} - ${childName}`
      : TAB_LABEL

    const tabButton = createTabButton(
      newId,
      tabLabel,
      appState.closeButtonsVisible,
    )

    if (!tabButton) {
      newWebview.remove()
      return
    }

    tabsContainer.appendChild(tabButton)

    let tabClosed = false
    let childSelectionDone = false
    let childSelectionPending = false

    function handleTabClick() {
      if (tabClosed) {
        return
      }

      activateTab(newId)
    }

    async function handleCloseClick(event) {
      event.preventDefault()
      event.stopPropagation()

      const shouldClose = await confirmDialog(
        'このタブを閉じますか？',
      )

      if (!shouldClose) {
        return
      }

      tabClosed = true

      tabButton.removeEventListener(
        'click',
        handleTabClick,
      )

      closeBtn?.removeEventListener(
        'click',
        handleCloseClick,
      )

      newWebview.removeEventListener(
        'did-finish-load',
        scheduleChildSelection,
      )

      newWebview.removeEventListener(
        'dom-ready',
        scheduleChildSelection,
      )

      closeTab(newId)

      if (newWebview.isConnected) {
        newWebview.remove()
      }

      if (tabButton.isConnected) {
        tabButton.remove()
      }
    }

    function scheduleChildSelection() {
      if (
        tabClosed ||
        childSelectionDone ||
        childSelectionPending ||
        !newWebview.isConnected
      ) {
        return
      }

      childSelectionPending = true

      // HUG側で読み込み後にフォームを生成するケースを考慮して少し待つ。
      window.setTimeout(() => {
        selectChildInWaitingListPage(
          newWebview,
          childId,
        )
          .then((ok) => {
            if (!tabClosed && ok) {
              childSelectionDone = true
            }
          })
          .finally(() => {
            childSelectionPending = false
          })
      }, 300)
    }

    tabButton.addEventListener(
      'click',
      handleTabClick,
    )

    const closeBtn =
      tabButton.querySelector('.close-btn')

    if (closeBtn) {
      closeBtn.addEventListener(
        'click',
        handleCloseClick,
      )
    }

    newWebview.addEventListener(
      'did-finish-load',
      scheduleChildSelection,
    )

    newWebview.addEventListener(
      'dom-ready',
      scheduleChildSelection,
    )

    console.log(
      '[WaitingListRegistration] キャンセル待ち登録タブを開きます',
      {
        tabId: newId,
        spaceId: effectiveSpaceId,
        childId,
        childName,
        targetDate,
        facilityId,
        url: url.toString(),
      },
    )

    activateTab(newId)
  }, [
    activateTab,
    appState,
    childId,
    childName,
    closeTab,
    effectiveSpaceId,
    space,
  ])

  const isDisabled =
    disabled ||
    !effectiveSpaceId ||
    !childId

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      title={
        childId
          ? `キャンセル待ちの登録を開く（児童ID: ${childId}）`
          : '児童を選択してください'
      }
      className={`
        rounded
        bg-amber-500
        px-3 py-2
        text-sm font-medium text-white
        cursor-pointer whitespace-nowrap
        transition-all
        hover:bg-amber-600 hover:scale-105
        active:bg-amber-700 active:scale-[0.97]
        disabled:grayscale disabled:opacity-50
        disabled:cursor-not-allowed
        disabled:hover:scale-100
        ${className}
      `}
    >
      {label}
    </button>
  )
}
