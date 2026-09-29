import { useEffect, useState } from 'react'

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
  const { appState } = useAppState()

  const debugEnabled = isDebugEnabled(
    appState?.DEBUG_FLG,
  )

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

  return (
    <section className="flex h-full min-h-0 w-full min-w-0 flex-col overflow-hidden bg-white">
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
            HUG WebView
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
            Automation WebView
          </button>

          <span className="ml-auto text-[11px] font-medium text-red-600">
            開発者モード
          </span>
        </div>
      )}

      <div className="relative h-full min-h-0 min-w-0 flex-1 overflow-hidden bg-white">
        <div
          className={[
            'absolute inset-0',
            !showAutomation
              ? 'visible z-10'
              : 'invisible z-0 pointer-events-none',
          ].join(' ')}
        >
          <HugWebview preloadPath={preloadPath} />
        </div>

        <div
          className={[
            'absolute inset-0',
            showAutomation
              ? 'visible z-10'
              : 'invisible z-0 pointer-events-none',
          ].join(' ')}
        >
          <HugAutomationWebview preloadPath={preloadPath} />
        </div>
      </div>
    </section>
  )
}

export { WEBVIEW_TABS }
