import { useAppInitialization } from '@/AppStateContext/useAppInitializer/useAppInitialization.js'
import { AppStateProvider } from '@/AppStateContext'

import Toolbar from './Header/Toolbar'
import Tabs from './Header/Tabs'
import MainContent from './MainContent'

import { usePreloadPath } from '@/hooks/usePreloadPath'
import { useActiveWebviewLogger } from '@/hooks/useTabs/useActiveWebviewLogger'

import DataBaseAutoLoader from '@/provider/DataBaseAutoLoader'

import { StartupAutoLoginListener } from '@/components/AutoLoginButton'
import HugAuthSyncBridge from '@/components/common/HugAuthSyncBridge'

function MainWindowContent() {
  const preloadPath = usePreloadPath()

  /*
   * アプリ初期化処理
   */
  useAppInitialization()

  /*
   * アクティブWebViewのログ出力
   */
  useActiveWebviewLogger()

  return (
    <div className="flex h-screen min-h-0 flex-col overflow-hidden">
      {/* 上部ツールバー */}
      <Toolbar />

      {/* メインタブ */}
      <Tabs />

      {/*
       * メインコンテンツ
       *
       * MainContent
       * └─ WebViewPanel
       *    ├─ #hugview
       *    └─ #hug-automation-webview
       *
       * 2つのWebViewはWebViewPanel側で管理する。
       */}
      <MainContent
        preloadPath={preloadPath}
      />

      {/*
       * hugview と hug-automation-webview 間で
       * HUGログイン状態を同期する。
       */}
      <HugAuthSyncBridge />

      {/*
       * アプリ起動時のHUG自動ログイン処理。
       *
       * 現在は WebViewPanel 内の
       * #hug-automation-webview を対象にする。
       */}
      <StartupAutoLoginListener />

      {/*
       * config確認用。
       * 既存処理との互換性維持のため残す。
       */}
      <pre
        id="configOutput"
        className="hidden"
      />
    </div>
  )
}

export default function MainWindow() {
  return (
    <AppStateProvider>
      {/*
       * DBデータの自動読み込み
       */}
      <DataBaseAutoLoader />

      <MainWindowContent />
    </AppStateProvider>
  )
}