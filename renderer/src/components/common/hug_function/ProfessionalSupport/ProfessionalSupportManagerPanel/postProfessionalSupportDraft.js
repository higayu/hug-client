import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'
import {
  executeProfessionalSupportDraftPostInWebview,
} from './professionalSupportWebAutomation.js'

/**
 * renderer で入力した専門的支援の内容を、HUG の編集画面を開かずに直接 POST する。
 *
 * 送信先URL、POST項目、CSRF取得、専門的支援IDなどは
 * DB の web_automation_flows / web_automation_flow_steps / web_automation_rules から取得する。
 *
 * 使用Flow:
 * - professional_support_draft_save
 *
 * 使用Rule:
 * - professional_support_draft_post
 */
export async function postProfessionalSupportDraft({
  childId,
  facilityId,
  dateStr,
  startTime = '',
  endTime = '',
  staffId,
  title = '記録',
  contents = '',
  saveMode = 'draft',
}) {
  if (!childId) throw new Error('児童IDがありません')
  if (!facilityId) throw new Error('施設IDがありません')
  if (!dateStr) throw new Error('実施日がありません')
  if (!staffId) throw new Error('記録者IDがありません')
  if (!String(contents || '').trim()) throw new Error('記録内容を入力してください')
  if (!['draft', 'created'].includes(saveMode)) {
    throw new Error(`保存種別が不正です: ${saveMode}`)
  }

  const webview = await getHugWebviewForCache()
  if (!webview) throw new Error('HUG の WebView が見つかりません')

  const payload = {
    childId: String(childId),
    facilityId: String(facilityId),
    dateStr: String(dateStr),
    startTime: String(startTime || ''),
    endTime: String(endTime || ''),
    staffId: String(staffId),
    title: String(title || '記録'),
    contents: String(contents || ''),
    saveMode: String(saveMode),
  }

  const result = await executeProfessionalSupportDraftPostInWebview(
    webview,
    payload,
  )

  if (!result?.ok || result?.saved !== true) {
    const actionLabel = saveMode === 'created' ? '保存' : '下書き保存'
    throw new Error(result?.error || `専門的支援の${actionLabel}に失敗しました`)
  }

  return result
}
