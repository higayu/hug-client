import { useAppState } from '@/AppStateContext';

import Dashboard from './Dashboard';
import SimpleBoard from './SimpleBoard';

/**
 * ini.json の設定に応じて通常版または簡易版を表示する。
 */
function NormalMode() {
  const { iniState } = useAppState();

  const normalModeView = iniState?.apiSettings?.normalModeView;

  return normalModeView === 'simpleBoard' ? <SimpleBoard /> : <Dashboard />;
}

export default NormalMode;
