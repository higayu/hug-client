import { useEffect } from 'react'
import Sidebar from './Sidebar'
import HorizonPanel from '@/components/ui/ResizableSplitPane/HorizonPanel'

function MainContent({ preloadPath }) {
  useEffect(() => {
    if (!preloadPath) return

    // グローバルにpreloadパスを保存
    window.preloadPath = preloadPath

    const webview = document.getElementById('hugview')
    if (webview && webview.getAttribute('preload') !== preloadPath) {
      webview.setAttribute('preload', preloadPath)
      console.log('✅ [MainContent] 初期webviewにpreload属性を設定:', preloadPath)
    }
  }, [preloadPath])

  return (
    <div
      id="content"
      className="relative z-[1] flex h-full min-h-0 min-w-0 flex-1 overflow-hidden"
    >
      <HorizonPanel
        defaultLeftPercent={70}
        minLeftWidth={300}
        minRightWidth={10}
        resizeBarWidth={14}
        gripWidth={8}
        left={(
          <aside
            id="settings"
            className="settings-sidebar z-10 flex h-full w-full flex-col overflow-hidden bg-[#f8f8f8] p-0 text-black shadow-[2px_0_8px_rgba(0,0,0,0.1)]"
          >
            <Sidebar />
          </aside>
        )}
        right={(
          <main
            id="webview-container"
            className="relative h-full min-h-0 min-w-0 overflow-hidden"
          >
            <webview
              id="hugview"
              src="https://www.hug-ayumu.link/hug/wm/"
              allowpopups="true"
              disablewebsecurity="true"
              preload={preloadPath}
              className="absolute inset-0 z-[1] h-full w-full overflow-hidden border-none"
            />
          </main>
        )}
      />
    </div>
  )
}

export default MainContent
