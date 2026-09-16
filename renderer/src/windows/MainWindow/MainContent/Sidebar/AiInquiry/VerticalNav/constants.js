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
    CHAT: 'chat',
    PERSONAL_RECORD: 'personalRecord',
  });

export const NAV_ITEMS = [
  {
    id: AI_INQUIRY_SCREENS.CHAT,
    icon: MessageSquare,
    label: 'AI問い合わせ',
  },
  {
    id: AI_INQUIRY_SCREENS.PERSONAL_RECORD,
    icon: UserSquare,
    label: '個人記録',
  },

];