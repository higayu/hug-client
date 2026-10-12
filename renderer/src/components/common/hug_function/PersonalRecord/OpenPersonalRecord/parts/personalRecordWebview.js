// WebViewの入力欄のみ操作します（UIの挿入は行いません）。
const EDIT_PAGE = /(?:contact_book|record_proceedings)\.php\?[^#]*mode=edit/

export function isPersonalRecordEditPage(webview) {
  return EDIT_PAGE.test(webview.getURL())
}

export async function readPersonalRecord(webview) {
  return webview.executeJavaScript(`(() => {
    const field = document.querySelector('textarea[name="note"]')
    return field ? { found: true, value: field.value || '' } : { found: false, value: '' }
  })()`)
}

export async function writePersonalRecord(webview, value) {
  const encoded = JSON.stringify(String(value ?? ''))
  return webview.executeJavaScript(`(() => {
    const field = document.querySelector('textarea[name="note"]')
    if (!field) return { ok: false, message: '記録の入力欄が見つかりません' }
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')?.set
    if (setter) setter.call(field, ${encoded})
    else field.value = ${encoded}
    field.dispatchEvent(new Event('input', { bubbles: true }))
    field.dispatchEvent(new Event('change', { bubbles: true }))
    return { ok: true }
  })()`)
}

export async function clickPersonalRecordDraft(webview) {
  return webview.executeJavaScript(`(() => {
    let button = document.querySelector('button[data-save-button][value="1"]')
      || document.querySelector('button.btn.btn-sm.draft[data-save-button=""]')
    if (!button) button = [...document.querySelectorAll('button')].find(b =>
      b.textContent.includes('下書き') || b.textContent.toLowerCase().includes('draft'))
    if (!button || button.disabled) return { ok: false, message: '下書き保存ボタンが見つからないか、無効です' }
    button.click()
    return { ok: true }
  })()`)
}
