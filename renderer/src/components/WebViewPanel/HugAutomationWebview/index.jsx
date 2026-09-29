const HUG_AUTOMATION_WEBVIEW_ID = 'hug-automation-webview'
const HUG_AUTOMATION_HOME_URL = 'https://www.hug-ayumu.link/hug/wm/'

/**
 * HUGのバックグラウンド自動処理専用WebView。
 * 非表示時もDOMから外さず常駐させる。
 */
export default function HugAutomationWebview({
  preloadPath,
  src = HUG_AUTOMATION_HOME_URL,
}) {
  return (
    <webview
      id={HUG_AUTOMATION_WEBVIEW_ID}
      src={src}
      allowpopups="true"
      disablewebsecurity="true"
      preload={preloadPath || undefined}
      className="h-full min-h-0 w-full min-w-0 border-0"
    />
  )
}

export {
  HUG_AUTOMATION_WEBVIEW_ID,
  HUG_AUTOMATION_HOME_URL,
}
