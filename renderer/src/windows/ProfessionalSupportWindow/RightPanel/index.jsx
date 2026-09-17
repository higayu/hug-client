import HugWebView from './HugWebView'

export default function RightPanel({ webviewRef, webviewReady }) {
  return (
    <aside className="relative w-[30%] min-w-0 bg-white">
      <div className="pointer-events-none absolute left-2 top-2 z-10 rounded bg-black/70 px-2 py-1 text-xs text-white">
        HUGセッション確認用 / {webviewReady ? 'ready' : 'loading'}
      </div>

      <HugWebView webviewRef={webviewRef} />
    </aside>
  )
}
