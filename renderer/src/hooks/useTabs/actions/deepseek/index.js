// renderer/src/hooks/useTabs/actions/deepseek.js
// DeepSeek タブを、個人記録などと同じ共通タブ領域へ追加する。

import { confirmDialog } from '@/utils/dialog/confirmDialog.js'
import {
  createWebview,
  createTabButton,
  activateTab,
  closeTab,
} from '../../common/index.js'

const DEEPSEEK_URL = 'https://chat.deepseek.com/'
const TAB_LABEL = 'DeepSeek'

export function addDeepseekTabAction(appState) {
  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-panel-content')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-panel-content が見つかりません')
    alert('タブ領域が見つかりません。')
    return
  }

  const newId = `deepseek-${Date.now()}-${document.querySelectorAll('webview').length}`
  const newWebview = createWebview(newId, DEEPSEEK_URL)

  // 個人記録・専門的支援などと同じ WebViewPanel 内へ追加する
  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    TAB_LABEL,
    appState.closeButtonsVisible
  )

  if (!tabButton) {
    newWebview.remove()
    return
  }

  // 個人記録などと同様に tabs へ登録
  tabsContainer.appendChild(tabButton)

  let tabClosed = false

  tabButton.addEventListener('click', () => {
    if (!tabClosed) activateTab(newId)
  })

  const closeBtn = tabButton.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()

      if (!(await confirmDialog('このタブを閉じますか？'))) return

      tabClosed = true
      closeTab(newId)
    })
  }

  activateTab(newId)
}
