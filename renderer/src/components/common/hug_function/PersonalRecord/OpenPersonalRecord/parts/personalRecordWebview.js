import { executeFlowV2 } from "@/components/WebAutomationV2/executeFlowV2"
export function isPersonalRecordEditPage(webview) {
  return /(?:contact_book|record_proceedings)\.php\?[^#]*mode=edit/.test(webview.getURL())
}
export const readPersonalRecord = webview => executeFlowV2('personal_record_dom_edit', { action: 'read' }, { webview })
export const writePersonalRecord = (webview, value) => executeFlowV2('personal_record_dom_edit', { action: 'write', value }, { webview })
export const clickPersonalRecordDraft = webview => executeFlowV2('personal_record_dom_edit', { action: 'draft' }, { webview })
