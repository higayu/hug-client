import { useEffect, useRef } from 'react'
import { isHugLoggedIn } from '@/hooks/useHugCache/isHugLoggedIn.js'
import {
  HUGVIEW_ID,
  HUG_AUTOMATION_WEBVIEW_ID,
} from '@/hooks/useHugCache/getHugCache.js'

const WAIT_TIMEOUT_MS = 15000
const RELOAD_COOLDOWN_MS = 1200

function waitForWebviewElement(id, timeout = WAIT_TIMEOUT_MS) {
  const current = document.getElementById(id)
  if (current) return Promise.resolve(current)

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

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })
  })
}

function reloadWebview(webview) {
  if (typeof webview?.reload === 'function') {
    webview.reload()
    return true
  }

  return false
}

/**
 * 表示用 #hugview と裏の #hug-automation-webview の認証状態を同期する。
 *
 * 両WebViewは同一Electron sessionを利用するため、Cookie自体は共有される。
 * ただし既に読み込み済みのページDOMには反映されないことがあるため、
 * 一方でログイン成功を検知したら、未ログイン側だけreloadする。
 */
export default function HugAuthSyncBridge() {
  const syncInProgressRef = useRef(false)
  const lastReloadAtRef = useRef({
    [HUGVIEW_ID]: 0,
    [HUG_AUTOMATION_WEBVIEW_ID]: 0,
  })

  useEffect(() => {
    let disposed = false
    let visibleWebview = null
    let automationWebview = null

    const safeReload = (targetId, targetWebview) => {
      const now = Date.now()
      const lastReloadAt = lastReloadAtRef.current[targetId] ?? 0

      if (now - lastReloadAt < RELOAD_COOLDOWN_MS) {
        return false
      }

      const reloaded = reloadWebview(targetWebview)
      if (reloaded) {
        lastReloadAtRef.current[targetId] = now
      }

      return reloaded
    }

    const syncAuthState = async (source) => {
      if (disposed || syncInProgressRef.current) {
        return
      }

      if (!visibleWebview || !automationWebview) {
        return
      }

      syncInProgressRef.current = true

      try {
        const [visibleLoggedIn, automationLoggedIn] = await Promise.all([
          isHugLoggedIn(visibleWebview).catch(() => false),
          isHugLoggedIn(automationWebview).catch(() => false),
        ])

        console.log('[HugAuthSyncBridge] auth state', {
          source,
          visibleLoggedIn,
          automationLoggedIn,
        })

        // ユーザーが表示用WebViewで直接ログインした場合。
        // Cookieは共有済みなので、裏WebViewをreloadしてログイン済みDOMへ更新する。
        if (visibleLoggedIn && !automationLoggedIn) {
          safeReload(HUG_AUTOMATION_WEBVIEW_ID, automationWebview)
          return
        }

        // 自動ログイン・手動Loginボタン等で裏WebViewがログインした場合。
        // 表示用WebViewをreloadしてログイン済み画面へ更新する。
        if (!visibleLoggedIn && automationLoggedIn) {
          safeReload(HUGVIEW_ID, visibleWebview)
        }
      } finally {
        syncInProgressRef.current = false
      }
    }

    const onVisibleFinishLoad = () => {
      void syncAuthState('visible-did-finish-load')
    }

    const onAutomationFinishLoad = () => {
      void syncAuthState('automation-did-finish-load')
    }

    const setup = async () => {
      try {
        ;[visibleWebview, automationWebview] = await Promise.all([
          waitForWebviewElement(HUGVIEW_ID),
          waitForWebviewElement(HUG_AUTOMATION_WEBVIEW_ID),
        ])

        if (disposed) return

        visibleWebview.addEventListener('did-finish-load', onVisibleFinishLoad)
        automationWebview.addEventListener(
          'did-finish-load',
          onAutomationFinishLoad
        )

        // 初期状態も一度だけ確認する。
        void syncAuthState('initial')
      } catch (error) {
        if (!disposed) {
          console.warn('[HugAuthSyncBridge] setup skipped:', error)
        }
      }
    }

    void setup()

    return () => {
      disposed = true

      visibleWebview?.removeEventListener(
        'did-finish-load',
        onVisibleFinishLoad
      )
      automationWebview?.removeEventListener(
        'did-finish-load',
        onAutomationFinishLoad
      )
    }
  }, [])

  return null
}
