export const EDIT_URL = 'https://www.hug-ayumu.link/hug/wm/record_proceedings.php?mode=edit'
export function isEditPage(webview) {
  try { const u = new URL(webview.getURL()); return u.origin === new URL(EDIT_URL).origin && u.pathname === new URL(EDIT_URL).pathname && u.searchParams.get('mode') === 'edit' } catch { return false }
}
import { executeFlowV2 } from '@/components/WebAutomationV2/executeFlowV2'
async function operate(webview, action, data) {
  if (!webview?.isConnected || !isEditPage(webview)) throw new Error('専門的支援の編集画面ではありません')
  const {childId, staffId, facilityId, dateStr, startTime, endTime, title, contents} = data
  const result = await executeFlowV2('professional_support_draft_save', {action, childId, staffId, facilityId, dateStr, startTime, endTime, title, contents}, {webview})
  if (!result?.ok) throw new Error('専門的支援の操作結果を確認できません')
  return result
}
export const setupProfessionalSupport = (w,d) => operate(w,'open',d)
export const readProfessionalSupport = (w,d) => operate(w,'read',d)
export const writeProfessionalSupport = (w,d) => operate(w,'write',d)
export const clickProfessionalSupportDraft = (w,d) => operate(w,'draft',d)
export const writeProfessionalSupportDraft = (w,d) => operate(w,'write_draft',d)
