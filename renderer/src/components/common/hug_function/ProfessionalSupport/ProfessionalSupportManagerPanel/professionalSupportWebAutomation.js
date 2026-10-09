import { executeFlowV2 } from '@/components/WebAutomationV2'

export async function executeProfessionalSupportDraftPostInWebview(_webview, payload) {
  return executeFlowV2('professional_support_draft_save', payload || {})
}

export async function executeProfessionalSupportUseDaysCheckInWebview(_webview, opts) {
  return executeFlowV2('professional_support_use_days_check', {
    childId: String(opts?.childId || ''),
    facilityId: String(opts?.facilityId || '3'),
    interviewDate: String(opts?.interviewDate || ''),
  })
}

export async function executeProfessionalSupportPlusRegister({ childId, facilityId, dateStr }) {
  return executeFlowV2('professional_support_plus_register', {
    childId: String(childId || ''),
    facilityId: String(facilityId || ''),
    dateStr: String(dateStr || ''),
  })
}

export async function executeProfessionalSupportPlusRegistrationCheck({ childId, facilityId, dateStr }) {
  return executeFlowV2('professional_support_plus_registration_check', {
    childId: String(childId || ''),
    facilityId: String(facilityId || ''),
    dateStr: String(dateStr || ''),
  })
}
