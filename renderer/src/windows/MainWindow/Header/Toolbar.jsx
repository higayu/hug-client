import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import {
  selectFacilityId,
} from '@/store/slices/appStateSlice';


import UrlContent from '@/components/ui/UrlContent';
import FacilitySelector from '@/components/FacilitySelector';
import ActiveApiStatus from '@/components/common/Synchronization/ActiveApiStatus';

import SupportPlanNavigation from './SupportPlanNavigation';
import ToolsListNavi from './ToolsListNavi';
import AutoLoginButton from './AutoLoginButton';
import SettingsEditButton from './SettingsEditButton';
import ModeNavi from "./ModeNavi";
import InformationButton from './InformationButton';

import { useAppState } from '@/AppStateContext';

export default function Toolbar() {
  const facilityId = useSelector(selectFacilityId);

  const {
    activeSidebarTab: activeTab,
    setActiveSidebarTab: setActiveTab,
    DEBUG_FLG,
  } = useAppState()

  // 施設IDの同期状態を追跡する診断ログ。ここでは値を更新しない。
  useEffect(() => {
    console.log(
      '[FacilitySync/Toolbar] 現在値',
      {
        facilityId,
        isEmpty: !facilityId,
      },
    );
  }, [facilityId]);

  return (
    <div
      id="toolbar"
      className="
        relative
        z-[1000]
        flex
        flex-none
        flex-nowrap
        items-center
        gap-2.5
        overflow-x-auto
        whitespace-nowrap
        bg-[#616161]
        text-white
        pointer-events-auto
      "
    >

     <ModeNavi />

      {/* 設定編集 */}
      <nav className="relative z-[1001] flex-shrink-0">
        <SettingsEditButton
          className="
            rounded-2xl
            border-none
            bg-gray-500
            px-4 py-2
            text-center
            text-sm
            text-white
            hover:bg-gray-400
          "
        />
      </nav>

      {/* 自動ログイン */}
      <AutoLoginButton />


      {/* URL・施設 */}
      <div className="flex w-full p-1">
        <div className="flex w-full flex-row items-center justify-between">
          {/* 左側グループ */}
          <div className="flex flex-row items-center gap-3">
            <UrlContent />

            {/* 施設名の表示 */}
            <FacilitySelector />

            {/* データベースAPI状態 */}
            <ActiveApiStatus  className="px-1 py-2"/>
          </div>

          {/* 右側グループ */}
          <div className="flex flex-row items-center gap-2">
            {/* Q&A・障害対応 */}
            <InformationButton />

            {/* 専門的支援計画 */}
            <SupportPlanNavigation />

            {/* ツールメニュー */}
            <ToolsListNavi />

          </div>
        </div>
      </div>
    </div>
  );
}
