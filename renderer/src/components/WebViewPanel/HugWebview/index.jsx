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
      className="absolute inset-0 h-full w-full border-0"
      style={{ width: '100%', height: '100%' }}
    />
  )
})

export default HugWebview

export {
  HUG_WEBVIEW_ID,
  HUG_HOME_URL,
}
