import {
  executeProfessionalSupportUseDaysCheckInWebview,
} from '../../../professionalSupportWebAutomation.js'

/**
 * アクティブ webview の HUG セッションで
 * 「専門的支援実施加算」の月初〜指定日までの保存済み件数を取得する。
 *
 * URL、検索POST項目、結果テーブルセレクタ、専門的支援IDなどは
 * DB の web_automation_flows / web_automation_flow_steps / web_automation_rules から取得する。
 *
 * 使用Flow:
 * - professional_support_use_days_check
 *
 * 使用Rule:
 * - professional_support_use_days_check
 *
 * @param {Electron.WebviewTag} webview
 * @param {{ childId: string, facilityId?: string, interviewDate?: string }} opts
 * @returns {Promise<
 *   | {
 *       ok: true;
 *       cId: string;
 *       interview_date: string;
 *       interview_date_end: string;
 *       s_id: string;
 *       f_id: string;
 *       days: number;
 *       label: string;
 *       rows: object[];
 *     }
 *   | { ok: false; error: string }
 * >}
 */
export async function fetchProfessionalSupportUseDaysInWebview(webview, opts) {
  const { childId, facilityId = '3', interviewDate = '' } = opts || {}

  if (!webview) {
    return { ok: false, error: 'webview がありません' }
  }

  if (!childId) {
    return { ok: false, error: '児童ID（childId）がありません' }
  }

  if (!interviewDate) {
    return { ok: false, error: '面談日（interview_date）がありません' }
  }

  const interviewDateEndForLog = String(interviewDate || '')
  const interviewDateStartForLog = `${interviewDateEndForLog.slice(0, 8)}01`

  console.log('[HUG WM] 専門的支援 利用日数 DB Flow 始め日', interviewDateStartForLog)
  console.log('[HUG WM] 専門的支援 利用日数 DB Flow 終わり日', interviewDateEndForLog)

  try {
    return await executeProfessionalSupportUseDaysCheckInWebview(webview, {
      childId: String(childId),
      facilityId: String(facilityId),
      interviewDate: String(interviewDate || ''),
    })
  } catch (e) {
    return {
      ok: false,
      error: e && e.message ? String(e.message) : String(e),
    }
  }
}
