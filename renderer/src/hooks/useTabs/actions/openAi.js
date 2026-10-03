// renderer/src/hooks/useTabs/actions/openAi.js
// OpenAI タブを、個人記録などと同じ共通タブ領域へ追加する。

import { confirmDialog } from '@/utils/dialog/confirmDialog.js'
import {
  createWebview,
  createTabButton,
  activateTab,
  closeTab,
} from '../common/index.js'
import { runEnableTemporaryChatAfterLoad } from '@/components/common/AI/OpenAiTabButton/enableTemporaryChatInWebview.js'

const OPENAI_URL = 'https://chatgpt.com/?temporary-chat=true'
const TAB_LABEL = 'OpenAI ChatGPT'

export function addOpenAiTabAction(appState) {
  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-panel-content')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-panel-content が見つかりません')
    alert('タブ領域が見つかりません。')
    return
  }

  const newId = `openai-${Date.now()}-${document.querySelectorAll('webview').length}`
  const newWebview = createWebview(newId, OPENAI_URL)

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
  let temporaryChatDone = false
  let enablePending = false

  const scheduleEnableTemporaryChat = () => {
    if (
      tabClosed ||
      temporaryChatDone ||
      enablePending ||
      !newWebview.isConnected
    ) {
      return
    }

    enablePending = true

    runEnableTemporaryChatAfterLoad(newWebview)
      .then((ok) => {
        if (!tabClosed && ok) temporaryChatDone = true
      })
      .catch((error) => {
        if (!tabClosed) {
          console.error('一時チャット有効化処理でエラー', error)
        }
      })
      .finally(() => {
        enablePending = false
      })
  }

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

  newWebview.addEventListener('did-finish-load', scheduleEnableTemporaryChat)
  newWebview.addEventListener('dom-ready', scheduleEnableTemporaryChat)

  activateTab(newId)
}
