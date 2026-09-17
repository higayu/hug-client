import { URL_TARGET1 } from '../../constants'

/**
 * HUGのログイン状態・Cookie共有状態を目視確認するためのWebView。
 * 表示中DOMから出席データや施設・年月を取得する用途には使用しない。
 *
 * 出席取得時は、このWebViewと同じHUGセッション上で
 * attendance.phpへのPOSTを実行し、そのレスポンスHTMLを解析する。
 */
export default function HugWebView({ webviewRef }) {
  return (
    <webview
      ref={webviewRef}
      src={URL_TARGET1}
      allowpopups="true"
      disablewebsecurity="true"
      className="absolute inset-0 h-full w-full border-none"
    />
  )
}
