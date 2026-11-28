// renderer/src/components/common/hug_function/PersonalRecord/OpenPersonalRecord/index.js

import { confirmDialog } from '@/utils/dialog/confirmDialog.js'
import {
  createWebview,
  createTabButton,
  activateTab,
  closeTab,
} from '@/hooks/useTabs/common/index.js'

import { executeFlowV2 } from "@/components/WebAutomationV2/executeFlowV2"
import { loadTempNote } from '@/hooks/useNote/noteUtils.js'
import { mountPersonalRecordControls } from './PersonalRecordModal.jsx'

export async function addPersonalRecordTabAction4(appState, space) {
  if (!space?.childId) {
    alert('子どもを選択してください')
    return
  }

  const memoContext = {
    STAFF_ID: space.staffId ?? appState.STAFF_ID,
    FACILITY_ID: space.facilityId ?? appState.FACILITY_ID,
    CURRENT_DAY_OF_WEEK: { ...appState.CURRENT_DAY_OF_WEEK },
    DATABASE_TYPE: appState.DATABASE_TYPE,
  }
  const recordDate = space.currentYmd ?? appState.CURRENT_YMD

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-panel-content')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-panel-content が見つかりません')
    return
  }

  // 本文未指定の既存呼び出しだけ、一時メモを呼び出し側で解決する。
  let initialContents = space.initialContents
  if (initialContents === undefined) {
    try {
      const note = { value: { memo1: '', memo2: '' } }
      await loadTempNote(space.childId, note, memoContext, { throwOnError: true })
      initialContents = note.value.memo1 ?? ''
    } catch (error) {
      alert('一時メモの取得に失敗しました: ' + error.message)
      return
    }
  }

  const newId =
    `hugview-${recordDate}-${document.querySelectorAll('webview').length}`

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

      controls?.destroy()
      closeTab(newId)
    })
  }

  let controls = null
  newWebview.addEventListener('did-finish-load', async () => {
    try {
      const result = await executeFlowV2('personal_record_dom_edit', {
        action: 'open', currentYmd: recordDate, staffId: memoContext.STAFF_ID, facilityId: memoContext.FACILITY_ID,
        childId: space.childId, initialContents,
      }, { webview: newWebview })
      if (!result?.found) throw new Error('記録欄が見つかりません')
      if (!newWebview.isConnected) return
      controls = mountPersonalRecordControls(newWebview, space.childName, space.childId, recordDate, true, memoContext, initialContents)
    } catch (error) { alert('個人記録の初期設定に失敗しました: ' + error.message) }
  }, { once: true })

  activateTab(newId)
  return { webview: newWebview, id: newId }
}
