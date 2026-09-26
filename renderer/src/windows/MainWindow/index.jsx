import { useAppInitialization } from '@/AppStateContext/useAppInitializer/useAppInitialization.js'
import { AppStateProvider } from '@/AppStateContext'
import Toolbar from './Header/Toolbar'
import Tabs from './Header/Tabs'
import MainContent from './MainContent'
import { usePreloadPath } from '@/hooks/usePreloadPath'
import { useActiveWebviewLogger } from '@/hooks/useTabs/useActiveWebviewLogger'
import DataBaseAutoLoader from '@/provider/DataBaseAutoLoader'
import { StartupAutoLoginListener } from '@/components/AutoLoginButton'

function MainWindowContent() {
  const preloadPath = usePreloadPath()

  useAppInitialization()
  useActiveWebviewLogger()

  return (
    <div className="flex h-screen flex-col">
      <Toolbar />
      <Tabs />
      <MainContent preloadPath={preloadPath} />
      <StartupAutoLoginListener />
      <pre id="configOutput" className="hidden" />
    </div>
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
