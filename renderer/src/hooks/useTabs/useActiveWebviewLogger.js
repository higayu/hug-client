// hooks/useTabs/useActiveWebviewLogger.js
import { useEffect } from 'react'

/**
 * active-webview-changed を監視してログ出力する
 * （デバッグ・動作確認用）
 */
export function useActiveWebviewLogger() {
  useEffect(() => {
    const handler = (e) => {
      const { webview, url, reason } = e?.detail || {}

      void 0
    }

    document.addEventListener('active-webview-changed', handler)
    return () => {
      document.removeEventListener('active-webview-changed', handler)
    }
  }, [])
}
