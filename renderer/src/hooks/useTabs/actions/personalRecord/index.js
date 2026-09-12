// renderer/src/hooks/useTabs/actions/personalRecord/index.js

import { confirmDialog } from '@/utils/dialog/confirmDialog.js'
import {
  createWebview,
  createTabButton,
  activateTab,
  closeTab,
} from '../../common/index.js'

import { runInitialSearch } from './parts/runInitialSearch.js'
import { openPersonalRecordEdit } from './parts/openPersonalRecordEdit.js'
import { setupRecordStaff } from './parts/setupRecordStaff.js'
import { injectPersonalRecordActions } from './parts/injectPersonalRecordActions.js'

export function addPersonalRecordTabAction4(appState, space) {
  if (!space?.childId) {
    alert('子どもを選択してください')
    return
  }

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-container')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-container が見つかりません')
    return
  }

  const newId =
    `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    `https://www.hug-ayumu.link/hug/wm/contact_book.php?id=${space?.childId}`
  )

  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    `個人記録 : ${space?.childName}`,
    appState.closeButtonsVisible
  )

  if (!tabButton) return

  tabsContainer.appendChild(tabButton)

  tabButton.addEventListener('click', () => {
    activateTab(newId)
  })

  const closeBtn = tabButton.querySelector('.close-btn')

  if (closeBtn) {
    closeBtn.addEventListener('click', async (event) => {
      event.stopPropagation()

      if (!(await confirmDialog('このタブを閉じますか？'))) {
        return
      }

      closeTab(newId)
    })
  }

  let phase = 'INIT'
  let newPersonalFlg = false

  // 初期検索
  newWebview.addEventListener(
    'did-finish-load',
    async () => {
      if (phase !== 'INIT') return

      phase = 'SEARCHING'

      await runInitialSearch(newWebview, appState.CURRENT_YMD)

      phase = 'SEARCHED'
    },
    { once: true }
  )

  // 一覧から編集画面へ
  newWebview.addEventListener('did-stop-loading', async () => {
    if (phase !== 'SEARCHED') return

    const url = await newWebview.getURL()

    if (!url.includes('contact_book.php')) {
      return
    }

    const result = await openPersonalRecordEdit(newWebview)

    if (!result) {
      return
    }

    newPersonalFlg = result.newFlg

    console.log('📌 newPersonalFlg =', newPersonalFlg)

    phase = 'EDIT_CLICKED'
  })

  // 編集画面の初期化
  newWebview.addEventListener('did-stop-loading', async () => {
    if (phase !== 'EDIT_CLICKED') return

    const url = await newWebview.getURL()

    if (
      !url.includes('contact_book.php?mode=edit') &&
      !url.includes('record_proceedings.php?mode=edit')
    ) {
      return
    }

    phase = 'EDIT_LOADED'

    if (newPersonalFlg) {
      console.log('📝 新規作成のため record_staff を自動設定します')

      await setupRecordStaff(newWebview, appState.STAFF_ID)
    } else {
      console.log('⏩ 既存データのため record_staff 設定スキップ')
    }

    await injectPersonalRecordActions(newWebview)
  })

  activateTab(newId)
}
