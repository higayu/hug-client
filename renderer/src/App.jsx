import { lazy, Suspense, useEffect } from 'react'

import MainWindow from '@/windows/MainWindow'
import { ToastProvider } from '@/provider/ToastProvider/ToastContext'
import { isHugLoggedIn } from '@/hooks/useHugCache/isHugLoggedIn.js'

const ProfessionalSupportWindow = lazy(
  () => import('@/windows/ProfessionalSupportWindow')
)

function resolveWindowType() {
  const params = new URLSearchParams(window.location.search)
  return params.get('window') ?? 'main'
}

const WINDOW_COMPONENTS = {
  main: MainWindow,
  professionalSupport: ProfessionalSupportWindow,
}

let didRunStartupAutoLogin = false

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

async function runStartupAutoLogin() {
  const configResult = await window.electronAPI?.readConfig?.()
  const config = configResult?.data ?? configResult
  const hasCredentials = Boolean(
    String(config?.HUG_USERNAME ?? '').trim() &&
    String(config?.HUG_PASSWORD ?? '')
  )

  if (!hasCredentials) return

  const webview = await waitForElement('hugview')
  if (await isHugLoggedIn(webview)) return

  await waitForElement('loginBtn')
  document.dispatchEvent(new CustomEvent('hug-startup-auto-login'))
}

export default function App() {
  const windowType = resolveWindowType()
  const WindowComponent = WINDOW_COMPONENTS[windowType] ?? MainWindow

  useEffect(() => {
    if (windowType !== 'main' || didRunStartupAutoLogin) return

    didRunStartupAutoLogin = true
    runStartupAutoLogin().catch((error) => {
      console.error('[App] 起動時のHUG自動ログインに失敗しました:', error)
    })
  }, [windowType])

  return (
    <ToastProvider>
      <Suspense fallback={<div className="p-4">画面を読み込んでいます...</div>}>
        <WindowComponent />
      </Suspense>
    </ToastProvider>
  )
}
