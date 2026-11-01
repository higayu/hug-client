import { useEffect } from 'react'
import { Toaster } from 'sonner'
import { notifications } from '@/utils/notifications.jsx'
import './AppToaster.css'

export default function AppToaster() {
  useEffect(() => {
    Object.assign(window, notifications)
    return () => {
      for (const [name, fn] of Object.entries(notifications)) {
        if (window[name] === fn) delete window[name]
      }
    }
  }, [])

  return <Toaster position="top-right" richColors closeButton duration={3000}
    visibleToasts={4} expand gap={10} offset={20} mobileOffset={20}
    className="hug-toaster" style={{ zIndex: 2147483646, '--width': '360px' }}
    toastOptions={{ closeButtonAriaLabel: '通知を閉じる' }} />
}
