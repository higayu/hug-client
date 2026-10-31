import { useState } from 'react'
import { MoonIcon } from '@heroicons/react/24/outline'
import { useAppState } from '@/AppStateContext'
import { useAppLock } from '@/components/ui/AppLook'
import { useToast } from '@/provider/ToastProvider/ToastContext'

export default function SleepButton({ onSleep }) {
  const { appState } = useAppState()
  const appLock = useAppLock()
  const { showErrorToast } = useToast()
  const [busy, setBusy] = useState(false)

  if (appState?.APP_LOCK_ENABLED !== true) return null

  const handleSleep = async () => {
    if (busy) return
    setBusy(true)
    try {
      onSleep?.()
      await appLock.lock()
    } catch (error) {
      showErrorToast(error?.message || 'ロックに失敗しました')
    } finally {
      setBusy(false)
    }
  }

  return (
    <li className="m-0 p-0">
      <button type="button" role="menuitem" disabled={busy} onClick={handleSleep}
        className="flex w-full items-center gap-2 border-none bg-slate-600 px-4 py-2 text-left text-sm text-white hover:bg-slate-800 focus:bg-slate-800 disabled:opacity-50">
        <MoonIcon className="h-4 w-4" aria-hidden="true" />
        Sleep（ロック）
      </button>
    </li>
  )
}
