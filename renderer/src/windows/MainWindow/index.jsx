import { useAppInitialization } from '@/AppStateContext/useAppInitializer/useAppInitialization.js'
import { AppStateProvider } from '@/AppStateContext'

import Toolbar from './Header/Toolbar'
import Tabs from './Header/Tabs'
import MainContent from './MainContent'

import { usePreloadPath } from '@/hooks/usePreloadPath'
import { useActiveWebviewLogger } from '@/hooks/useTabs/useActiveWebviewLogger'
import { useUpdateUI } from '@/hooks/useUpdateUI'

import DataBaseAutoLoader from '@/provider/DataBaseAutoLoader'

import { StartupAutoLoginListener } from '@/components/AutoLoginButton'
import HugAuthSyncBridge from '@/components/common/HugAuthSyncBridge'
import UpdateNotificationModal from '@/components/UpdateNotificationModal'

function MainWindowContent() {
  const preloadPath = usePreloadPath()

  useAppInitialization()
  useActiveWebviewLogger()

  const {
    updateInfo,
    isUpdateModalOpen,
    isDownloading,
    downloadProgress,
    updateError,
    closeUpdateModal,
    startUpdate,
  } = useUpdateUI()

  return (
    <>
      <div className="flex h-screen min-h-0 flex-col overflow-hidden">
        <Toolbar />

        <Tabs />

        {/*
         * MainContent
         * └─ WebViewPanel
         *    ├─ #hugview
         *    └─ #hug-automation-webview
         *
         * 2つのWebViewはWebViewPanel側で一括管理する。
         */}
        <MainContent preloadPath={preloadPath} />

        {/*
         * 表示用WebViewとAutomation WebViewの
         * HUGログイン状態を同期する。
         */}
        <HugAuthSyncBridge />

        {/*
         * 起動時のHUG自動ログイン。
         * #hug-automation-webview を優先して使用する。
         */}
        <StartupAutoLoginListener />

        <pre
          id="configOutput"
          className="hidden"
        />
      </div>

      <UpdateNotificationModal
        isOpen={isUpdateModalOpen}
        updateInfo={updateInfo}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        updateError={updateError}
        onClose={closeUpdateModal}
        onUpdate={startUpdate}
      />
    </>
  )
}

export default function MainWindow() {
  return (
    <AppStateProvider>
      <DataBaseAutoLoader />
      <MainWindowContent />
    </AppStateProvider>
  )
}
