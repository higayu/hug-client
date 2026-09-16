// src/components/Sidebar/AiInquiry/VerticalNav/index.jsx

import {
  useAppState,
} from '@/AppStateContext';

import {
  NAV_ITEMS,
} from './constants';

import NavHeader from './NavHeader';
import NavItem from './NavItem';

/**
 * AI問い合わせ用サイドバーナビゲーション。
 *
 * item.idをAppRouterで使用する画面IDとして扱う。
 * 選択状態の取得・変更はAppStateContext経由で行う。
 */
export default function VerticalNav({
  items = NAV_ITEMS,
  className = '',
  buttonClassName = '',
  ariaLabel = 'AI問い合わせナビゲーション',
}) {
  const {
    AI_INQUIRY_SELECTED_ITEM_ID,
    setAiInquiryScreen,
  } = useAppState();

  /**
   * AI問い合わせ内の表示画面を変更する。
   */
  const handleItemClick = (screenId) => {
    if (!screenId) {
      return;
    }

    setAiInquiryScreen(screenId);
  };

  return (
    <aside
      className={`
        flex
        h-full
        shrink-0
        flex-col
        overflow-hidden
        border-r
        border-gray-700
        bg-gray-800
        text-white
        dark:border-gray-700
        dark:bg-gray-900
        ${className}
      `}
    >
      <NavHeader />

      <nav
        className="
          flex
          min-h-0
          flex-1
          flex-col
          overflow-y-auto
          py-2
        "
        aria-label={ariaLabel}
      >
        {items.map((item) => (
          <NavItem
            key={item.id}
            item={item}
            isActive={
              AI_INQUIRY_SELECTED_ITEM_ID ===
              item.id
            }
            onSelect={handleItemClick}
            buttonClassName={
              buttonClassName
            }
          />
        ))}
      </nav>
    </aside>
  );
}