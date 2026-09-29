WebViewPanel simple rebuild

TaskWindow/WebviewList方式に寄せて、以下を削除しています。
- ResizeObserver
- width/heightのpx直接指定
- Shadow DOM iframe操作
- fixInternalIframe.js
- webview自身へのabsolute/z-index/opacity/visibility制御

WebView本体は h-full w-full のみ。
前後切替は外側wrapperの visible/invisible/z-index/pointer-events で行います。

配置先:
renderer/src/components/WebViewPanel/
