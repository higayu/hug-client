import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import { selectFacilityId } from '@/store/slices/appStateSlice';

import UrlContent from '@/components/ui/UrlContent';
import FacilitySelector from '@/components/FacilitySelector';
import ActiveApiStatus from '@/components/common/Synchronization/ActiveApiStatus';

import ToolsListNavi from './ToolsListNavi';
import SettingsEditButton from './SettingsEditButton';
import BansoNavi from './BansoNavi';
import InformationButton from './InformationButton';

import { useAppState } from '@/AppStateContext';

export default function Toolbar() {
  const facilityId = useSelector(selectFacilityId);

  const {
    activeSidebarTab: activeTab,
    setActiveSidebarTab: setActiveTab,
    DEBUG_FLG,
    isCompanyAutomationEnabled,
  } = useAppState();

  // 施設IDの同期状態を追跡する診断ログ。ここでは値を更新しない。
  useEffect(() => {
    void 0;
  }, [facilityId]);

  return (
    <div
      id="toolbar"
      className={`
        relative
        z-[1000]
        flex
        flex-none
        flex-nowrap
        items-center
        gap-2
        overflow-x-auto
        whitespace-nowrap
        pointer-events-auto
        ${
          isCompanyAutomationEnabled
            ? 'bg-[#616161] text-white'
            : 'bg-white text-gray-800'
        }
      `}
    >
      <div className="flex-shrink-0">
        <BansoNavi />
      </div>

      {/* 設定編集 */}
      <nav className="relative z-[1001] flex-shrink-0">
        <SettingsEditButton
          className="
            rounded-2xl
            border-none
            bg-gray-500
            px-4
            py-2
            text-center
            text-sm
            text-white
            hover:bg-gray-400
          "
        />
      </nav>

      {/* URL・施設・各種メニュー */}
      <div className="flex min-w-0 flex-1 flex-row flex-nowrap items-center gap-3 p-1">
        {/* URL */}
        <div className="min-w-0 flex-1">
          <UrlContent />
        </div>

        {/* 施設名 */}
        <div className="flex-shrink-0">
          <FacilitySelector />
        </div>

        {/* データベースAPI状態 */}
        <ActiveApiStatus className="flex-shrink-0 px-1 py-2 !text-xs" />

        {/* Q&A・障害対応 */}
        <div className="flex-shrink-0">
          <InformationButton />
        </div>

        {/* ツールメニュー */}
        <div className="flex-shrink-0">
          <ToolsListNavi />
        </div>
      </div>
    </div>
  );
}