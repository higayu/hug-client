import { lazy, Suspense, useEffect } from 'react'

import MainWindow from '@/windows/MainWindow'
import { ToastProvider } from '@/provider/ToastProvider/ToastContext'
import { runStartupAutoLogin } from '@/components/AutoLoginButton/runStartupAutoLogin.js'

const ProfessionalSupportWindow = lazy(
  () => import('@/windows/ProfessionalSupportWindow')
)
const InformationWindow = lazy(() => import('@/windows/InformationWindow'))
const PhpMyAdminWindow = lazy(() => import('@/windows/PhpMyAdminWindow'))

function resolveWindowType() {
  const params = new URLSearchParams(window.location.search)
  return params.get('window') ?? 'main'
}

const WINDOW_COMPONENTS = {
  main: MainWindow,
  professionalSupport: ProfessionalSupportWindow,
  information: InformationWindow,
  informationWindow: InformationWindow,
  phpMyAdmin: PhpMyAdminWindow,
}

let didRunStartupAutoLogin = false

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
