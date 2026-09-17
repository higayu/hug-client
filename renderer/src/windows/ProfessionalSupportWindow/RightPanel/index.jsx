import HugWebView from './HugWebView'

export default function RightPanel({ webviewRef, webviewReady }) {
  return (
    <aside className="relative h-full min-h-0 w-full min-w-0 overflow-hidden bg-white">
      <div className="pointer-events-none absolute left-2 top-2 z-10 rounded bg-black/70 px-2 py-1 text-xs text-white">
        HUGセッション確認用 / {webviewReady ? 'ready' : 'loading'}
      </div>

      <HugWebView webviewRef={webviewRef} />
    </aside>
  )
}
