const HUG_WEBVIEW_ID = 'hugview'
const HUG_HOME_URL = 'https://www.hug-ayumu.link/hug/wm/'

export default function HugWebview({
  preloadPath,
  src = HUG_HOME_URL,
}) {
  return (
    <webview
      id={HUG_WEBVIEW_ID}
      src={src}
      allowpopups="true"
      disablewebsecurity="true"
      preload={preloadPath || undefined}
      className="h-full min-h-0 w-full min-w-0 border-0"
    />
  )
}

export {
  HUG_WEBVIEW_ID,
  HUG_HOME_URL,
}
