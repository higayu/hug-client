import { forwardRef } from 'react'

const HUG_AUTOMATION_WEBVIEW_ID = 'hug-automation-webview'
const HUG_AUTOMATION_HOME_URL = 'https://www.hug-ayumu.link/hug/wm/'

/**
 * HUGのバックグラウンド自動処理専用WebView。
 * 非表示時もDOMから外さず常駐させる。
 */
const HugAutomationWebview = forwardRef(
  function HugAutomationWebview(
    {
      preloadPath,
      src = HUG_AUTOMATION_HOME_URL,
    },
    ref,
  ) {
    return (
      <webview
        ref={ref}
        id={HUG_AUTOMATION_WEBVIEW_ID}
        src={src}
        allowpopups="true"
        disablewebsecurity="true"
        preload={preloadPath || undefined}
        className="absolute inset-0 h-full w-full border-0"
      style={{ width: '100%', height: '100%' }}
      />
    )
  },
)

export default HugAutomationWebview

export {
  HUG_AUTOMATION_WEBVIEW_ID,
  HUG_AUTOMATION_HOME_URL,
}
