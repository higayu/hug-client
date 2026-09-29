import { useEffect } from 'react'

import Sidebar from './Sidebar'

import WebViewPanel from '@/components/WebViewPanel'
import HorizonPanel from '@/components/ui/ResizableSplitPane/HorizonPanel'

function MainContent({ preloadPath }) {
  useEffect(() => {
    if (!preloadPath) {
      return
    }

    /*
     * 他の処理からも参照できるように、
     * preloadパスをグローバルへ保持する。
     */
    window.preloadPath = preloadPath

    console.log(
      '✅ [MainContent] preloadPathを設定:',
      preloadPath,
    )
  }, [preloadPath])

  return (
    <div
      id="content"
      className="
        relative
        z-[1]
        flex
        h-full
        min-h-0
        min-w-0
        flex-1
        overflow-hidden
      "
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
            className="
              settings-sidebar
              z-10
              flex
              h-full
              w-full
              flex-col
              overflow-hidden
              bg-[#f8f8f8]
              p-0
              text-black
              shadow-[2px_0_8px_rgba(0,0,0,0.1)]
            "
          >
            <Sidebar />
          </aside>
        )}
        right={(
          <main
            id="webview-container"
            className="
              relative
              h-full
              min-h-0
              min-w-0
              overflow-hidden
            "
          >
            <WebViewPanel
              preloadPath={preloadPath}
            />
          </main>
        )}
      />
    </div>
  )
}

export default MainContent