import { FaPersonRunning } from 'react-icons/fa6';

import PortalDropdown from '@/components/ui/PortalDropdown';
import { useAppState } from '@/AppStateContext';

export default function BansoNavi({
  className = '',
}) {
  const {
    showAiInquiry,
    showDashboard,
    IS_AI_INQUIRY_MODE,
    IS_DASHBOARD_MODE,
  } = useAppState();

  /**
   * モードの選択状態に応じたボタンスタイル。
   */
  const getMenuButtonClassName = (
    isSelected
  ) => `
    flex
    w-full
    cursor-pointer
    items-center
    justify-between
    border-none
    px-4
    py-2.5
    text-left
    text-sm
    transition-colors
    duration-150
    focus:outline-none
    ${
      isSelected
        ? `
          bg-[#1565c0]
          font-semibold
          text-white
          hover:bg-[#0d47a1]
          focus:bg-[#0d47a1]
        `
        : `
          bg-white
          font-normal
          text-gray-700
          hover:bg-[#2196f3]
          hover:text-white
          focus:bg-[#2196f3]
          focus:text-white
        `
    }
  `;

  /**
   * AI問い合わせモードへ切り替える。
   */
  const handleShowAiInquiry = (
    closeMenu
  ) => {
    showAiInquiry();
    closeMenu();
  };

  /**
   * ダッシュボードモードへ切り替える。
   */
  const handleShowDashboard = (
    closeMenu
  ) => {
    showDashboard();
    closeMenu();
  };

  return (
    <PortalDropdown
      id="tools-list-menu"
      ariaLabel="伴走ナビ"
      align="start"
      menuClassName="
        max-h-[400px]
        min-w-[220px]
        max-w-[calc(100vw-16px)]
        overflow-hidden
        overflow-y-auto
        rounded-b-md
        border
        border-gray-200
        bg-white
        shadow-lg
      "
      trigger={({
        isOpen,
        triggerRef,
        toggleMenu,
        menuId,
      }) => (
        <nav
          className={`
            relative
            z-[1001]
            ml-0
            inline-block
            min-w-fit
            flex-shrink-0
            ${className}
          `}
          aria-label="伴走ナビ"
        >
          <button
            ref={triggerRef}
            id="panel-btn"
            type="button"
            onClick={toggleMenu}
            className="
              relative
              z-[1002]
              flex
              cursor-pointer
              items-center
              gap-2
              whitespace-nowrap
              border-none
              bg-[#515152]
              px-3
              py-1.5
              text-sm
              text-white
              transition-colors
              hover:bg-[#2196f3]
              focus:bg-[#2196f3]
              focus:outline-none
            "
            aria-haspopup="menu"
            aria-expanded={isOpen}
            aria-controls={
              isOpen
                ? menuId
                : undefined
            }
          >
            <FaPersonRunning
              className="
                h-5
                w-5
                flex-shrink-0
                text-white
              "
              aria-hidden="true"
            />

            <span>
              伴走ナビ
            </span>

            <span
              className={`
                inline-block
                text-xs
                opacity-80
                transition-transform
                ${
                  isOpen
                    ? 'rotate-180'
                    : ''
                }
              `}
              aria-hidden="true"
            >
              ▾
            </span>
          </button>
        </nav>
      )}
    >
      {({ closeMenu }) => (
        <ul
          className="
            m-0
            list-none
            divide-y
            divide-gray-100
            p-0
          "
          role="menu"
        >
          <li
            className="m-0 p-0"
            role="none"
          >
            <button
              type="button"
              onClick={() =>
                handleShowAiInquiry(
                  closeMenu
                )
              }
              className={
                getMenuButtonClassName(
                  IS_AI_INQUIRY_MODE
                )
              }
              role="menuitem"
              aria-current={
                IS_AI_INQUIRY_MODE
                  ? 'page'
                  : undefined
              }
            >
              <span>
                伴走ナビ
              </span>

              {IS_AI_INQUIRY_MODE && (
                <span
                  className="
                    ml-3
                    text-xs
                    font-bold
                  "
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          </li>

          <li
            className="m-0 p-0"
            role="none"
          >
            <button
              type="button"
              onClick={() =>
                handleShowDashboard(
                  closeMenu
                )
              }
              className={
                getMenuButtonClassName(
                  IS_DASHBOARD_MODE
                )
              }
              role="menuitem"
              aria-current={
                IS_DASHBOARD_MODE
                  ? 'page'
                  : undefined
              }
            >
              <span>
                ノーマルモード
              </span>

              {IS_DASHBOARD_MODE && (
                <span
                  className="
                    ml-3
                    text-xs
                    font-bold
                  "
                  aria-hidden="true"
                >
                  ✓
                </span>
              )}
            </button>
          </li>
        </ul>
      )}
    </PortalDropdown>
  );
}
