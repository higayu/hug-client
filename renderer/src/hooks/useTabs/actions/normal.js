// renderer/src/hooks/useTabs/actions/normal.js

import { createWebview, createTabButton, activateTab, closeTab } from '../common/index.js'
import { confirmDialog } from '@/utils/dialog/confirmDialog.js'

export function addNormalTabAction(appState) {
  console.log('🔍 [useTabs] ＋ボタンがクリックされました')

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-panel-content')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-panel-content が見つかりません')
    return
  }

  const newId = `hugview-${Date.now()}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    `https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail&f_id=${appState.FACILITY_ID}&date=${appState.CURRENT_YMD}`
  )

  webviewContainer.appendChild(newWebview)

  const index = tabsContainer.querySelectorAll("button[data-target^='hugview']").length + 1
  const tabButton = createTabButton(newId, `Hug-${index}`, appState.closeButtonsVisible)

  if (!tabButton) return

  // 追加ボタンの前に挿入
  const addTabBtn = document.getElementById('add-tab-btn')
  if (addTabBtn) tabsContainer.insertBefore(tabButton, addTabBtn)
  else tabsContainer.appendChild(tabButton)

  // --- クリックで切り替え ---
  tabButton.addEventListener('click', () => activateTab(newId))

  // --- 閉じる処理 ---
  // ✅ 対策: window.confirm() は renderer の JS スレッドを完全に止めてしまい、
  //          webview構成のこのアプリでは「ダイアログが裏に隠れる」
  //          「押すまで数秒〜間、入力や操作が一切効かなくなる」原因になっていた。
  //          非同期のネイティブダイアログ(confirmDialog)に置き換える。
  const closeBtn = tabButton.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', async (e) => {
      e.stopPropagation()

    const ok = await confirmDialog('このタブを閉じますか？')
    if (!ok) return

      closeTab(newId)
    })
  }

  activateTab(newId)
}