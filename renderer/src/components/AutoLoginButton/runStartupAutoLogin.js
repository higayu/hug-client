import { isHugLoggedIn } from '@/hooks/useHugCache/isHugLoggedIn.js'
import { HUG_AUTOMATION_WEBVIEW_ID } from '@/hooks/useHugCache/getHugCache.js'

function waitForElement(id, timeout = 15000) {
  const currentElement = document.getElementById(id)
  if (currentElement) return Promise.resolve(currentElement)

  return new Promise((resolve, reject) => {
    const observer = new MutationObserver(() => {
      const element = document.getElementById(id)
      if (!element) return

      clearTimeout(timeoutId)
      observer.disconnect()
      resolve(element)
    })
    const timeoutId = setTimeout(() => {
      observer.disconnect()
      reject(new Error(`${id} が見つかりません`))
    }, timeout)

    observer.observe(document.body, { childList: true, subtree: true })
  })
}

export async function runStartupAutoLogin() {
  const configResult = await window.electronAPI?.readConfig?.()
  const config = configResult?.data ?? configResult
  const hasCredentials = Boolean(
    String(config?.HUG_USERNAME ?? '').trim() &&
    String(config?.HUG_PASSWORD ?? '')
  )

  if (!hasCredentials) return

  // 起動時ログインは表示用 #hugview ではなく、裏の常駐WebViewを対象にする。
  const webview = await waitForElement(HUG_AUTOMATION_WEBVIEW_ID)
  if (await isHugLoggedIn(webview)) return

  document.dispatchEvent(
    new CustomEvent('hug-startup-auto-login', {
      detail: {
        webviewId: HUG_AUTOMATION_WEBVIEW_ID,
      },
    })
  )
}

export default runStartupAutoLogin
