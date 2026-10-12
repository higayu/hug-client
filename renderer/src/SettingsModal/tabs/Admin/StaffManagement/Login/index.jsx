import { useEffect, useState } from 'react'

import { useToast } from '@/provider/ToastProvider/ToastContext'
import { useDataBase } from '@/hooks/useDataBase'

export default function Login({ staff }) {
  const { showSuccessToast, showErrorToast } = useToast()
  const { reloadData } = useDataBase()
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    setLoginId(staff?.login_id ?? '')
    setPassword('')
    setPasswordConfirmation('')
  }, [staff?.id, staff?.login_id])

  const handleSave = async () => {
    if (isSaving || !staff?.id) return

    if (!loginId.trim()) {
      showErrorToast('ログインIDを入力してください。')
      return
    }

    if (password && password.length < 8) {
      showErrorToast('パスワードは8文字以上で入力してください。')
      return
    }

    if (password !== passwordConfirmation) {
      showErrorToast('確認用パスワードが一致しません。')
      return
    }

    setIsSaving(true)

    try {
      const result = await window.electronAPI?.laravel_admin_update_staff_login({
        staffId: Number(staff.id),
        login_id: loginId.trim(),
        password: password || null,
        password_confirmation: passwordConfirmation || null,
      })

      if (!result?.success) {
        throw new Error(result?.message || 'ログイン情報の更新に失敗しました。')
      }

      setPassword('')
      setPasswordConfirmation('')

      if (typeof reloadData === 'function') {
        await reloadData({
          reason: 'staff-login-updated',
          force: true,
        })
      }

      showSuccessToast('ログイン情報を更新しました。')
    } catch (error) {
      showErrorToast(error?.message || 'ログイン情報の更新に失敗しました。')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <h3 className="mb-2 border-b border-gray-200 pb-2 text-lg text-gray-700">
        ログイン情報
      </h3>

      <p className="mb-5 text-sm text-gray-600">
        {staff?.name}のログインIDとパスワードを変更します。
      </p>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          ログインID
          <input
            type="text"
            value={loginId}
            onChange={(event) => setLoginId(event.target.value)}
            maxLength={255}
            autoComplete="off"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <div />

        <label className="block text-sm font-medium text-gray-700">
          新しいパスワード
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            autoComplete="new-password"
            placeholder="変更しない場合は空欄"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>

        <label className="block text-sm font-medium text-gray-700">
          新しいパスワード（確認）
          <input
            type="password"
            value={passwordConfirmation}
            onChange={(event) => setPasswordConfirmation(event.target.value)}
            minLength={8}
            autoComplete="new-password"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
        </label>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-md bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? '保存中...' : 'ログイン情報を保存'}
        </button>
      </div>
    </div>
  )
}
