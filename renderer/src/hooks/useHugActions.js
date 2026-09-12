// src/hooks/useHugActions.js
// hugActions.jsの機能をReact hooksに移行

import { useEffect, useCallback, useRef } from 'react'
import { useSelector } from 'react-redux'
import { selectActiveSpaceId, selectSpace } from '@/store/slices/chilledspaceSlice.js'
import { useAppState } from '@/AppStateContext'
import { useToast } from '@/provider/ToastProvider/ToastContext'
import { getActiveWebview } from '@/utils/webview/webviewState.js'
import { loadAllReload } from '@/utils/config/reloadSettings.js'
// ❌ 削除: import { updateButtonVisibility } from '@/utils/app/buttonVisibility.js'
import { useCustomButtonManager } from './useCustomButtonManager.js'

export function useHugActions(spaceId) {
  const { appState } = useAppState()
  const activeSpaceId = useSelector(selectActiveSpaceId)
  const effectiveSpaceId = spaceId || activeSpaceId
  const space = useSelector(selectSpace(effectiveSpaceId))
  const { showSuccessToast, showErrorToast } = useToast()
  const { reloadCustomButtons } = useCustomButtonManager()
  const initializedRef = useRef(false)

  // 自動ログイン
  const handleLogin = useCallback(async () => {
    console.log('🖱️ [HugActions] loginBtn clicked')

    const vw = getActiveWebview()
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
      await vw.executeJavaScript(`
        document.querySelector('input[name="username"]').value = ${JSON.stringify(appState.HUG_USERNAME)};
        document.querySelector('input[name="password"]').value = ${JSON.stringify(appState.HUG_PASSWORD)};
        const checkbox = document.querySelector('input[name="setexpire"]');
        if (checkbox && !checkbox.checked) checkbox.click();
        document.querySelector("input.btn-login")?.click();
      `)
    } catch (err) {
      console.error('❌ ログインスクリプト実行エラー:', err)
      alert('ログインスクリプト実行に失敗しました')
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

  // ini.jsonの手動読み込み
  const handleLoadIni = useCallback(async () => {
    try {
      const reloadOk = await loadAllReload()

      if (reloadOk) {
        // ❌ 削除: updateButtonVisibility()
        // buttonVisibility.js は廃止されました
        await reloadCustomButtons()
        showSuccessToast('✅ 設定の再読み込みが完了しました')
      }
    } catch (err) {
      console.error('❌ ini.json読み込みエラー:', err)
      alert('❌ エラーが発生しました: ' + err.message)
    }
  }, [reloadCustomButtons, showSuccessToast])

  // ボタンのイベントリスナーを設定
  useEffect(() => {
    if (initializedRef.current) return
    initializedRef.current = true

    // loginBtn
    const loginBtn = document.getElementById('loginBtn')
    if (loginBtn) {
      console.log('🔗 [HugActions] Attaching click listener: loginBtn')
      loginBtn.addEventListener('click', handleLogin)
    }

    // Individual_Support_Button
    const individualBtn = document.getElementById('Individual_Support_Button')
    if (individualBtn) {
      individualBtn.addEventListener('click', handleIndividualSupport)
    }

    // Specialized-Support-Plan
    const specializedBtn = document.getElementById('Specialized-Support-Plan')
    if (specializedBtn) {
      specializedBtn.addEventListener('click', handleSpecializedSupport)
    }

    // Get-Url
    const getUrlBtn = document.getElementById('Get-Url')
    if (getUrlBtn) {
      console.log('🔗 [HugActions] Attaching click listener: Get-Url')
      getUrlBtn.addEventListener('click', handleGetUrl)
    }

    // ===== クリーンアップ =====
    return () => {
      if (loginBtn) {
        loginBtn.removeEventListener('click', handleLogin)
      }

      if (individualBtn) {
        individualBtn.removeEventListener('click', handleIndividualSupport)
      }

      if (specializedBtn) {
        specializedBtn.removeEventListener('click', handleSpecializedSupport)
      }

      if (getUrlBtn) {
        getUrlBtn.removeEventListener('click', handleGetUrl)
      }

    }
  }, [
    handleLogin,
    handleIndividualSupport,
    handleSpecializedSupport,
    handleGetUrl,
  ])

  return {
    handleLogin,
    handleGetUrl,
    handleIndividualSupport,
    handleSpecializedSupport,
    handleLoadIni,
  }
}
