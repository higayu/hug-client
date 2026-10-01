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

  const debugEnabled = isDebugEnabled(DEBUG_FLG)

  const [activeTab, setActiveTab] = useState(
    WEBVIEW_TABS.HUG,
  )

  useEffect(() => {
    if (!debugEnabled) {
      setActiveTab(WEBVIEW_TABS.HUG)
    }
  }, [debugEnabled])

  const showAutomation =
    debugEnabled &&
    activeTab === WEBVIEW_TABS.AUTOMATION

  /**
   * 現在表示中のWebViewのDevToolsを開く。
   */
  const handleOpenDevTools = () => {
    const webview = showAutomation
      ? automationWebviewRef.current
      : hugWebviewRef.current

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
            title={
              showAutomation
                ? 'Automation WebView のDevToolsを開く'
                : 'HUG WebView のDevToolsを開く'
            }
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
            'absolute inset-0',
            !showAutomation
              ? 'visible z-10'
              : 'invisible z-0 pointer-events-none',
          ].join(' ')}
        >
          <HugWebview
            ref={hugWebviewRef}
            preloadPath={preloadPath}
          />
        </div>

        <div
          className={[
            'absolute inset-0',
            showAutomation
              ? 'visible z-10'
              : 'invisible z-0 pointer-events-none',
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
