import { useEffect, useState } from 'react'

export default function AuthDialog({ host, onCancel, onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setUsername('')
    setPassword('')
    setSubmitting(false)
    setError('')
  }, [host])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      await onLogin({ username, password })
    } catch (submitError) {
      setError(submitError?.message || String(submitError))
      setSubmitting(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/55 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-7 text-slate-900 shadow-2xl"
      >
        <h2 className="text-xl font-bold">ログイン</h2>
        <p className="mt-4 break-all text-sm text-slate-600">{host}</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              ユーザー名
            </span>
            <input
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700">
              パスワード
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-full bg-cyan-200 px-6 py-2.5 text-sm font-semibold text-slate-900 hover:bg-cyan-300 disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="submit"
            disabled={submitting || !username.trim() || !password}
            className="rounded-full bg-cyan-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-cyan-800 disabled:opacity-50"
          >
            {submitting ? 'ログイン中...' : 'ログイン'}
          </button>
        </div>
      </form>
    </div>
  )
}
