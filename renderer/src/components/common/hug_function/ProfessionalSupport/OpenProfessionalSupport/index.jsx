import { createWebview, createTabButton, activateTab, closeTab } from '@/hooks/useTabs/common/index.js'
import { confirmDialog } from '@/utils/dialog/confirmDialog.js'
import { EDIT_URL, setupProfessionalSupport } from './parts/professionalSupportWebview.js'
import { mountProfessionalSupportControls } from './ProfessionalSupportModal.jsx'

export function addProfessionalSupportTabAction(appState, space = {}) {
  const data = { childId: String(space.childId ?? appState.SELECT_CHILD ?? ''), childName: space.childName ?? appState.SELECT_CHILD_NAME, facilityId: String(space.facilityId ?? appState.FACILITY_ID ?? ''), staffId: String(space.staffId ?? appState.STAFF_ID ?? ''), dateStr: space.dateStr ?? space.date ?? appState.CURRENT_YMD, startTime: space.startTime ?? space.enterTime ?? appState.SELECTED_CHILD_COLUMN5 ?? '', endTime: space.endTime ?? space.leaveTime ?? appState.SELECTED_CHILD_COLUMN6 ?? '', title: space.title || '記録', contents: space.contents ?? '', professionalPlanNotes: space.professionalPlanNotes ?? '' }
  if (!data.childId || !data.staffId || !data.facilityId || !/^\d{4}-\d{2}-\d{2}$/.test(data.dateStr || '')) throw new Error('児童・施設・職員・日付を確認してください')
  const tabs = document.getElementById('tabs'), panel = document.getElementById('webview-panel-content') || document.getElementById('webview-container')
  if (!tabs || !panel) throw new Error('タブのコンテナが見つかりません')
  const id = `hugview-professional-${Date.now()}-${Math.random().toString(36).slice(2)}`
  const webview = createWebview(id, EDIT_URL)
  const tab = createTabButton(id, `専門的加算 : ${data.childName || data.childId}`, appState.closeButtonsVisible)
  if (!tab) throw new Error('タブを作成できません')
  let controls, closed = false, started = false
  tab.addEventListener('click', () => activateTab(id))
  tab.querySelector('.close-btn')?.addEventListener('click', async e => { e.stopPropagation(); if (await confirmDialog('このタブを閉じますか？')) { closed=true; controls?.destroy(); closeTab(id) } })
  webview.addEventListener('did-finish-load', async () => {
    if(started || closed) return; started=true
    try { const initial=await setupProfessionalSupport(webview,data); if(!closed && webview.isConnected) controls=mountProfessionalSupportControls(webview,{...initial,...data},tab) }
    catch(e) { if(!closed) alert(`専門的支援の初期設定に失敗しました: ${e.message}`) }
  })
  panel.appendChild(webview); tabs.appendChild(tab); activateTab(id)
  return {webview, id}
}
export default addProfessionalSupportTabAction
