import { isHugLoggedIn } from '@/hooks/useHugCache/isHugLoggedIn.js'

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

  const webview = await waitForElement('hugview')
  if (await isHugLoggedIn(webview)) return

  document.dispatchEvent(new CustomEvent('hug-startup-auto-login'))
}

export default runStartupAutoLogin
