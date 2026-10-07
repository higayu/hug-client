import { useEffect, useRef, useState } from 'react'

import { useAppState } from '@/AppStateContext'

import HugWebview from './HugWebview'
import HugAutomationWebview from './HugAutomationWebview'

const WEBVIEW_TABS = Object.freeze({
  HUG: 'hug',
  AUTOMATION: 'automation',
})

function isDebugEnabled(value) {
  return (
    value === true ||
    value === 1 ||
    value === '1' ||
    value === 'true'
  )
}

/**
 * 表示用 #hugview と自動処理用 #hug-automation-webview を管理する。
 *
 * TaskWindow の WebviewList と同じ考え方で、
 * 2つのWebViewは常時DOMに残したまま、外側wrapperの
 * visible / invisible / z-index / pointer-events だけを切り替える。
 */
export default function WebViewPanel({ preloadPath }) {
  const { DEBUG_FLG } = useAppState()

  const hugWebviewRef = useRef(null)
  const automationWebviewRef = useRef(null)

  // useTabs / webviewState 側で管理されている、
  // 現在アクティブなWebViewを保持する。
  // 個人記録・専門的支援・OpenAI・DeepSeekなどの
  // 動的WebViewも active-webview-changed から取得できる。
  const activeWebviewRef = useRef(null)

  const debugEnabled = isDebugEnabled(DEBUG_FLG)

  const [activeTab, setActiveTab] = useState(
    WEBVIEW_TABS.HUG,
  )

  useEffect(() => {
    if (!debugEnabled) {
      setActiveTab(WEBVIEW_TABS.HUG)
    }
  }, [debugEnabled])

  // 初期表示のHUG WebViewをDevTools対象として保持する。
  useEffect(() => {
    if (hugWebviewRef.current && !activeWebviewRef.current) {
      activeWebviewRef.current = hugWebviewRef.current
    }
  }, [])

  // useTabs/common/activateTab.js から setActiveWebview() が呼ばれると、
  // active-webview-changed が発火する。
  // これを監視することで動的に追加されたWebViewもDevTools対象にできる。
  useEffect(() => {
    const handleActiveWebviewChanged = (event) => {
      const webview = event?.detail?.webview

      if (webview) {
        activeWebviewRef.current = webview
      }
    }

    document.addEventListener(
      'active-webview-changed',
      handleActiveWebviewChanged,
    )

    return () => {
      document.removeEventListener(
        'active-webview-changed',
        handleActiveWebviewChanged,
      )
    }
  }, [])

  const showAutomation =
    debugEnabled &&
    activeTab === WEBVIEW_TABS.AUTOMATION

  /**
   * 現在アクティブになっているWebViewのDevToolsを開く。
   *
   * 対象例:
   * - HUG
   * - Automation
   * - 個人記録
   * - 専門的支援
   * - OpenAI
   * - DeepSeek
   */
  const handleOpenDevTools = () => {
    const webview = activeWebviewRef.current

    if (!webview) {
      console.warn(
        '[WebViewPanel] WebViewがまだ準備されていないためDevToolsを開けません。',
      )
      return
    }

    if (typeof webview.openDevTools !== 'function') {
      console.error(
        '[WebViewPanel] openDevTools() が利用できません。',
      )
      return
    }

    webview.openDevTools()
  }

  return (
    <section
      id="webview-panel"
      className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white"
    >
      {debugEnabled && (
        <div className="flex flex-none items-center gap-1 border-b border-slate-300 bg-slate-100 px-2 py-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab(WEBVIEW_TABS.HUG)

              if (hugWebviewRef.current) {
                activeWebviewRef.current = hugWebviewRef.current
              }
            }}
            className={[
              'rounded px-3 py-1.5 text-xs font-semibold transition-colors',
              !showAutomation
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:bg-white/70',
            ].join(' ')}
          >
            HUG-WebView
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab(WEBVIEW_TABS.AUTOMATION)

              if (automationWebviewRef.current) {
                activeWebviewRef.current = automationWebviewRef.current
              }
            }}
            className={[
              'rounded px-3 py-1.5 text-xs font-semibold transition-colors',
              showAutomation
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-slate-600 hover:bg-white/70',
            ].join(' ')}
          >
            Automation
          </button>

          <button
            type="button"
            onClick={handleOpenDevTools}
            className="ml-auto rounded bg-slate-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-800"
            title="現在アクティブなWebViewのDevToolsを開く"
          >
            DevTools
          </button>

          <span className="text-[11px] font-medium text-red-600">
            Debug
          </span>
        </div>
      )}

      <div
        id="webview-panel-content"
        className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-white"
      >
        <div
          className={[
            // webview は非表示時も描画サイズを維持する。
            // visibility:hidden にすると Electron/Chromium 側で再描画されず、
            // 再表示時に真っ白になることがあるため opacity で切り替える。
            'absolute inset-0 h-full w-full',
            !showAutomation
              ? 'z-10 opacity-100'
              : 'z-0 opacity-0 pointer-events-none',
          ].join(' ')}
        >
          <HugWebview
            ref={hugWebviewRef}
            preloadPath={preloadPath}
          />
        </div>

        <div
          className={[
            // 自動処理用WebViewは常時DOM上・描画領域ありの状態を保つ。
            // 非表示時も読み込み/JS/モーダル操作を継続できるようにする。
            'absolute inset-0 h-full w-full',
            showAutomation
              ? 'z-10 opacity-100'
              : 'z-0 opacity-0 pointer-events-none',
          ].join(' ')}
        >
          <HugAutomationWebview
            ref={automationWebviewRef}
            preloadPath={preloadPath}
          />
        </div>
      </div>
    </section>
  )
}

export { WEBVIEW_TABS }
