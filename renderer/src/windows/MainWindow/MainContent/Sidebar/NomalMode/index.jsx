import { useAppState } from '@/AppStateContext';

import Dashboard from './Dashboard';
import SimpleBoard from './SimpleBoard';

/**
 * ini.json の設定に応じて通常版または簡易版を表示する。
 */
function NormalMode() {
  const { iniState } = useAppState();

  if (
    iniState?.apiSettings?.normalModeView ===
    'dashboard'
  ) {
    return <Dashboard />;
  }

  return <SimpleBoard />;
}

export default NormalMode;
