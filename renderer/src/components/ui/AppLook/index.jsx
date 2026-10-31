import PassWordInput from '@/components/ui/PassWordInput'
import { createContext, useContext, useEffect, useRef, useState } from 'react'

const AppLockContext = createContext(null)
export const useAppLock = () => useContext(AppLockContext)

export default function AppLook({ children }) {
  const [status, setStatus] = useState('loading')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hasUnlocked, setHasUnlocked] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    if (status === 'unlocked') setHasUnlocked(true)
    if (contentRef.current) contentRef.current.inert = status !== 'unlocked'
  }, [status])

  const lock = async () => {
    const result = await window.electronAPI.getAppLockStatus()
    if (!result.success) throw new Error(result.error)
    if (!result.enabled) return false
    setPasscode('')
    setError('')
    setStatus(result.configured ? 'locked' : 'unconfigured')
    return true
  }

  useEffect(() => {
    let active = true
    window.electronAPI.getAppLockStatus().then((result) => {
      if (!active) return
      if (!result.success) throw new Error(result.error)
      setStatus(result.enabled ? (result.configured ? 'locked' : 'unconfigured') : 'unlocked')
    }).catch((err) => {
      if (!active) return
      setStatus('error')
      setError(err.message || 'ロック設定を読み込めませんでした。アプリを再起動してください。')
    })
    return () => { active = false }
  }, [])

  const unlock = async (event) => {
    event.preventDefault()
    if (busy) return
    setBusy(true)
    setError('')
    try {
      const result = await window.electronAPI.unlockApp(passcode)
      setPasscode('')
      if (result.success) setStatus('unlocked')
      else setError('パスコードが違います。')
    } catch {
      setError('ロック解除に失敗しました。もう一度お試しください。')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppLockContext.Provider value={{ lock }}>
      {(hasUnlocked || status === 'unlocked') && (
        <div ref={contentRef} hidden={status !== 'unlocked'} aria-hidden={status !== 'unlocked'}>
          {children}
        </div>
      )}
      {status !== 'unlocked' && (
    <main className="fixed inset-0 z-[2147483647] flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <section className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-xl font-bold text-gray-800">アプリのロック</h1>
        {status === 'loading' && <p>設定を確認しています...</p>}
        {status === 'unconfigured' && <p role="alert">パスコードが未設定です。config.jsonのAPP_LOCK_PASSCODEに文字列を設定するか、APP_LOCK_ENABLEDをfalseにして、アプリを再起動してください。</p>}
        {status === 'locked' && (
          <form onSubmit={unlock} className="flex flex-col gap-4">
            <label htmlFor="app-lock-passcode">パスコードを入力してください</label>
            <PassWordInput containerClassName="w-full" visibilityLabel="パスコード" id="app-lock-passcode" autoFocus autoComplete="off"
              value={passcode} onChange={(event) => setPasscode(event.target.value)}
              disabled={busy} required className="rounded border border-gray-300 px-3 py-2" />
            <button type="submit" disabled={busy || !passcode}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50">
              {busy ? '確認中...' : 'ロック解除'}
            </button>
          </form>
        )}
        {error && <p role="alert" className="mt-4 text-sm text-red-600">{error}</p>}
      </section>
    </main>
      )}
    </AppLockContext.Provider>
  )
}
