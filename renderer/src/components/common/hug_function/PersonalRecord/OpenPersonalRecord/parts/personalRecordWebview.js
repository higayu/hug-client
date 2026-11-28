import { executeFlowV2 } from "@/components/WebAutomationV2/executeFlowV2"
export function isPersonalRecordEditPage(webview) {
  return /(?:contact_book|record_proceedings)\.php\?[^#]*mode=edit/.test(webview.getURL())
}
export const readPersonalRecord = (webview, context = {}) => executeFlowV2('personal_record_dom_edit', { ...context, action: 'read' }, { webview })
export const writePersonalRecord = (webview, value, context = {}) => executeFlowV2('personal_record_dom_edit', { ...context, action: 'write', value }, { webview })
export const clickPersonalRecordDraft = (webview, context = {}) => executeFlowV2('personal_record_dom_edit', { ...context, action: 'draft' }, { webview })
