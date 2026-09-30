import { forwardRef } from 'react'

const HUG_WEBVIEW_ID = 'hugview'
const HUG_HOME_URL = 'https://www.hug-ayumu.link/hug/wm/'

const HugWebview = forwardRef(function HugWebview(
  {
    preloadPath,
    src = HUG_HOME_URL,
  },
  ref,
) {
  return (
    <webview
      ref={ref}
      id={HUG_WEBVIEW_ID}
      src={src}
      allowpopups="true"
      disablewebsecurity="true"
      preload={preloadPath || undefined}
      className="h-full min-h-0 w-full min-w-0 border-0"
    />
  )
})

export default HugWebview

export {
  HUG_WEBVIEW_ID,
  HUG_HOME_URL,
}
