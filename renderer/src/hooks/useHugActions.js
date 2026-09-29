// src/hooks/useHugActions.js
// hugActions.jsの機能をReact hooksに移行

import { useCallback } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveSpaceId, selectSpace } from '@/store/slices/chilledspaceSlice.js'
import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { getActiveWebview } from '@/utils/webview/webviewState.js'

export function useHugActions(spaceId) {
  const { appState } = useAppState()
  const activeSpaceId = useSelector(selectActiveSpaceId)
  const effectiveSpaceId = spaceId || activeSpaceId
  const space = useSelector(selectSpace(effectiveSpaceId))
  const { showSuccessToast, showErrorToast } = useToast()

  // 自動ログイン
  const handleLogin = useCallback(async ({ webviewId = null } = {}) => {
    console.log('🖱️ [HugActions] login requested', { webviewId })

    const vw = webviewId
      ? document.getElementById(webviewId)
      : getActiveWebview()

    if (!vw) {
      alert('Webview が見つかりません')
      return
    }

    await new Promise((resolve) => {
      if (vw.isLoading()) {
        vw.addEventListener('did-finish-load', resolve, { once: true })
      } else {
        resolve()
      }
    })

    if (!appState.HUG_USERNAME || !appState.HUG_PASSWORD) {
      alert('config.json がまだ読み込まれていません。')
      return
    }

    console.log('🚀 自動ログイン開始...')

    try {
      const navigationCompleted = new Promise((resolve) => {
        let settled = false

        const finish = () => {
          if (settled) return
          settled = true
          clearTimeout(timeoutId)
          resolve()
        }

        const timeoutId = setTimeout(finish, 10000)
        vw.addEventListener('did-finish-load', finish, { once: true })
      })

      const clicked = await vw.executeJavaScript(`
        (() => {
          const username = document.querySelector('input[name="username"]');
          const password = document.querySelector('input[name="password"]');
          const loginButton = document.querySelector('input.btn-login');

          if (!username || !password || !loginButton) {
            return false;
          }

          username.value = ${JSON.stringify(appState.HUG_USERNAME)};
          password.value = ${JSON.stringify(appState.HUG_PASSWORD)};

          const checkbox = document.querySelector('input[name="setexpire"]');
          if (checkbox && !checkbox.checked) checkbox.click();

          loginButton.click();
          return true;
        })()
      `)

      if (!clicked) {
        console.warn('⚠️ ログインフォームが見つかりませんでした')
        return false
      }

      await navigationCompleted
      return true
    } catch (err) {
      console.error('❌ ログインスクリプト実行エラー:', err)
      alert('ログインスクリプト実行に失敗しました')
      return false
    }
  }, [appState.HUG_USERNAME, appState.HUG_PASSWORD])

  // 個別支援計画（別ウインドウ）
  const handleIndividualSupport = useCallback(() => {
    window.electronAPI.openIndividualSupportPlan(
      space?.childId,
      appState.FACILITY_ID
    )
  }, [space?.childId, appState.FACILITY_ID])

  // 専門的支援計画（別ウインドウ）
  const handleSpecializedSupport = useCallback(() => {
    window.electronAPI.openSpecializedSupportPlan(
      space?.childId,
      appState.FACILITY_ID
    )
  }, [space?.childId, appState.FACILITY_ID])

  // URLの取得
  const handleGetUrl = useCallback(async () => {
    console.log('🖱️ [HugActions] Get-Url clicked')

    try {
      console.log('🔄 URLの取得処理を開始...')

      const vw = getActiveWebview()

      if (!vw) {
        showErrorToast('❌ WebViewが見つかりません')
        return
      }

      const url = vw.getURL()
      console.log('📋 取得したURL:', url)

      if (!url || url === 'about:blank') {
        showErrorToast('❌ URLが取得できませんでした')
        return
      }

      await navigator.clipboard.writeText(url)
      console.log('✅ URLをクリップボードにコピーしました:', url)

      const urlObj = new URL(url)
      const shortUrl = urlObj.hostname + urlObj.pathname

      showSuccessToast(`✅ URLをコピーしました\n${shortUrl}`)
    } catch (err) {
      console.error('❌ URL取得・コピーエラー:', err)

      try {
        const vw = getActiveWebview()

        if (!vw) {
          showErrorToast('❌ WebViewが見つかりません')
          return
        }

        const url = vw.getURL()

        const textArea = document.createElement('textarea')
        textArea.value = url
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)

        showSuccessToast('✅ URLをクリップボードにコピーしました（フォールバック）')
        console.log('✅ フォールバック方式でコピー成功')
      } catch (fallbackErr) {
        console.error('❌ フォールバック方式も失敗:', fallbackErr)
        showErrorToast('❌ URLのコピーに失敗しました')
      }
    }
  }, [showSuccessToast, showErrorToast])

  return {
    handleLogin,
    handleGetUrl,
    handleIndividualSupport,
    handleSpecializedSupport,
  }
}
