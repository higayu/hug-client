// src/components/Sidebar/AiInquiry/VerticalNav/constants.js

import {
  Activity,
  FileEdit,
  LayoutDashboard,
  MessageSquare,
  UserSquare,
} from 'lucide-react';

/**
 * AppRouterで使用する画面ID
 */
export const AI_INQUIRY_SCREENS =
  Object.freeze({
    DASHBOARD: 'dashboard',
    AI_RECORD_EDITER: 'aiRecordEditer',
    CHAT: 'chat',
    PERSONAL_RECORD: 'personalRecord',
    HEALTH_ANALYSIS: 'healthAnalysis',
  });

export const NAV_ITEMS = [
  {
    id: AI_INQUIRY_SCREENS.AI_RECORD_EDITER,
    icon: FileEdit,
    label: 'AI校正機能',
  },
  {
    id: AI_INQUIRY_SCREENS.CHAT,
    icon: MessageSquare,
    label: 'AI問い合わせ',
  },
  // {
  //   id: AI_INQUIRY_SCREENS.DASHBOARD,
  //   icon: LayoutDashboard,
  //   label: 'ダッシュボード',
  // },
  {
    id: AI_INQUIRY_SCREENS.PERSONAL_RECORD,
    icon: UserSquare,
    label: '個人記録',
  },
  {
    id: AI_INQUIRY_SCREENS.HEALTH_ANALYSIS,
    icon: Activity,
    label: '健康分析',
    isNew: true,
  },
];