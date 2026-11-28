import { useState } from 'react'
import { MoonIcon } from '@heroicons/react/24/outline'
import { useAppState } from '@/AppStateContext'
import { useAppLock } from '@/components/ui/AppLook'
import { useToast } from '@/utils/notifications.jsx'

export default function SleepButton({
  onSleep,
  className = '',
  label = 'Sleep（ロック）',
  role,
}) {
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
    <button
      type="button"
      role={role}
      aria-label={label || 'Sleep（ロック）'}
      title={label || 'Sleep（ロック）'}
      disabled={busy}
      onClick={handleSleep}
      className={className}
    >
      <MoonIcon className="h-4 w-4" aria-hidden="true" />
      {label}
    </button>
  )
}
