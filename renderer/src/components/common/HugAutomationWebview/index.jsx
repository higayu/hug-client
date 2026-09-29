const HUG_AUTOMATION_WEBVIEW_ID = 'hug-automation-webview'
const HUG_AUTOMATION_HOME_URL = 'https://www.hug-ayumu.link/hug/wm/'

/**
 * HUGのバックグラウンド自動処理専用WebView。
 *
 * - ユーザー表示用の #hugview とは分離する
 * - ログイン、Cookie、HTTPキャッシュ、自動遷移、native-onclick 実行に使用する
 * - display:none にはせず、画面外の1px領域で常駐させる
 * - partitionを指定しないことで、既存 #hugview と同じ標準セッションを利用する
 */
export default function HugAutomationWebview({ preloadPath }) {
  if (!preloadPath) return null

  return (
    <webview
      id={HUG_AUTOMATION_WEBVIEW_ID}
      src={HUG_AUTOMATION_HOME_URL}
      allowpopups="true"
      disablewebsecurity="true"
      preload={preloadPath}
      aria-hidden="true"
      tabIndex={-1}
      className="pointer-events-none fixed -left-[10000px] top-0 h-px w-px opacity-0"
    />
  )
}

export { HUG_AUTOMATION_WEBVIEW_ID, HUG_AUTOMATION_HOME_URL }
