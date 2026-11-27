// renderer/src/hooks/useTabs/common/closeTab.js

import { getRegisteredTabs } from '@/hooks/useTabs/common/getRegisteredTabs'
import { activateTab } from '@/hooks/useTabs/common/activateTab'
import { store } from '@/store/store'

/**
 * タブを閉じる共通関数（Redux管理URLログ版）
 * @param {string} targetId - 閉じるwebviewのID
 */
export function closeTab(targetId) {
  const tabsContainer = document.getElementById('tabs')
  const content = document.getElementById('content')

  if (!tabsContainer || !content) return

  const webview = document.getElementById(targetId)
  const tabButton = tabsContainer.querySelector(
    `button[data-target="${targetId}"]`
  )

  if (!webview || !tabButton) return

  // このタブがアクティブかどうか
  const activeId =
    store.getState().appState.ACTIVE_WEBVIEW_ID ||
    document.querySelector('#tabs .active-tab')?.dataset?.target

  const isActive = activeId === targetId

  // --- 次にアクティブにするIDを決定 ---
  let nextActiveId = null

  if (isActive) {
    // ① デフォルト優先
    const defaultBtn = tabsContainer.querySelector(
      'button[data-target="hugview"]'
    )
    if (defaultBtn && targetId !== 'hugview') {
      nextActiveId = 'hugview'
    } else {
      // ② 一覧の先頭
      const tabs = getRegisteredTabs().filter(t => t.id !== targetId)
      if (tabs.length > 0) {
        nextActiveId = tabs[0].id
      }
    }
  }

  // --- DOM削除 ---
  webview.remove()
  tabButton.remove()

  // --- 次のタブをアクティブ ---
  if (nextActiveId) {
    activateTab(nextActiveId)

    // ★ Redux 管理の URL をログ出力
    const { ACTIVE_WEBVIEW_URL } = store.getState().appState

    void 0
  }
}
