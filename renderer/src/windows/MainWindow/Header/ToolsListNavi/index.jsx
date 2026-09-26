import {
    AdjustmentsHorizontalIcon,
    ArrowPathIcon,
    ArrowsPointingOutIcon,
    MinusIcon,
    PowerIcon,
    TrashIcon,
  } from '@heroicons/react/24/outline';
  
  import { useToast } from '@/provider/ToastProvider/ToastContext'
  import { useAppState } from '@/AppStateContext';
  import { useTabs } from '@/hooks/useTabs';
  import { useHugActions } from '@/hooks/useHugActions';
  
  import PortalDropdown from '@/components/ui/PortalDropdown';
  import ServerConnectButton from '@/components/common/Synchronization/ServerConnectButton';
  import DataBaseButton from '@/components/common/Synchronization/DataBaseButton';
  import StaffUpdateButton from '@/components/common/Synchronization/StaffUpdateButton';
  import ChildrenUpdateButton from '@/components/common/Synchronization/ChildrenUpdateButton';
  import {
    ProfessionalSupportSearch,
  } from '@/components/common/hug_function/ProfessionalSupport';
  import AutoLoginButton from '@/components/AutoLoginButton';

export default function ToolsListNavi({
    className = '',
  }) {
    const { showInfoToast } = useToast();
    const { DEBUG_FLG, FACILITY_ID } = useAppState();
    const facilityId = FACILITY_ID;
    const { clearActiveWebviewCache } =
      useTabs();
  
    const { handleGetUrl } =
      useHugActions();
  
    /**
     * WebViewキャッシュ削除
     */
    const handleClearWebviewCache =
      async (closeMenu) => {
        closeMenu();
  
        try {
          const result =
            await clearActiveWebviewCache();
  
          showInfoToast(
            result
              ? '🧹 キャッシュ削除完了！'
              : '⚠ キャッシュの削除に失敗しました',
          );
        } catch (error) {
          console.error(
            '[ToolsListNavi] WebViewキャッシュ削除エラー:',
            error,
          );
  
          showInfoToast(
            '⚠ キャッシュの削除に失敗しました',
          );
        }
      };
  
    /**
     * 現在のURLを取得
     */
    const handleGetUrlClick =
      async (closeMenu) => {
        closeMenu();
  
        try {
          await handleGetUrl();
        } catch (error) {
          console.error(
            '[ToolsListNavi] URL取得エラー:',
            error,
          );
        }
      };
  
    /**
     * デベロッパーツールを開く
     */
    const handleOpenDevTools = (
      closeMenu,
    ) => {
      closeMenu();
  
      try {
        window.api?.openDevTools?.();
      } catch (error) {
        console.error(
          '[ToolsListNavi] DevTools起動エラー:',
          error,
        );
      }
    };

    const handleWindowAction = async (
      closeMenu,
      action,
      actionName,
    ) => {
      closeMenu();

      try {
        await action?.();
      } catch (error) {
        console.error(
          `[ToolsListNavi] ${actionName}エラー:`,
          error,
        );
      }
    };

    const windowMenuButtonClass = `
      flex
      w-full
      cursor-pointer
      items-center
      gap-2
      border-none
      bg-transparent
      px-4
      py-2
      text-left
      text-sm
      text-black
      transition-colors
      hover:bg-[#e3f2fd]
      focus:bg-[#e3f2fd]
      focus:outline-none
    `;
  
    return (
      <PortalDropdown
        id="tools-list-menu"
        ariaLabel="ツールメニュー"
        align="start"
        menuClassName="
          max-h-[400px]
          min-w-[220px]
          max-w-[calc(100vw-16px)]
          overflow-hidden
          overflow-y-auto
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
            aria-label="ツール"
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
              <AdjustmentsHorizontalIcon
                className="
                  h-5
                  w-5
                  flex-shrink-0
                  text-white
                "
                aria-hidden="true"
              />
  
              <span>ツール</span>
  
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
          <ul className="m-0 list-none p-0 py-1">
            <li className="m-0 p-0">
              <button
                id="cash-Clear"
                type="button"
                role="menuitem"
                onClick={() => {
                  handleClearWebviewCache(
                    closeMenu,
                  );
                }}
                className="
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  gap-2
                  border-none
                  bg-green-600
                  px-4
                  py-2
                  text-left
                  text-sm
                  text-white
                  transition-colors
                  hover:bg-green-900
                  focus:bg-green-900
                  focus:outline-none
                "
              >
                <TrashIcon
                  className="
                    h-4
                    w-4
                    flex-shrink-0
                    text-white
                  "
                  aria-hidden="true"
                />
  
                <span>
                  WebViewのキャッシュクリア
                </span>
              </button>
            </li>
  

            <li className="m-0 p-0">
              <ProfessionalSupportSearch />
            </li>


            <li
              className="m-0 p-0"
              onClick={closeMenu}
            >
              <DataBaseButton
                className="w-full py-2"
              />
            </li>
  
            {DEBUG_FLG && (
            <>
              <li
                className="m-0 p-0"
                onClick={closeMenu}
              >
                <StaffUpdateButton
                  facilityId={facilityId}
                  disabled={!facilityId}
                  className="w-full"
                />
              </li>

              <li
                className="m-0 p-0"
                onClick={closeMenu}
              >
                <ChildrenUpdateButton
                  facilityId={facilityId}
                  disabled={!facilityId}
                  className="w-full bg-yellow-500 flex items-center justify-center text-center text-white transition-colors hover:bg-yellow-600 disabled:cursor-wait disabled:opacity-60 text-sm gap-2 px-4 py-2"
                />
              </li>
              <li className="m-0 p-0">
                <button
                  id="Get-Url"
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    handleGetUrlClick(
                      closeMenu,
                    );
                  }}
                  className="
                    block
                    w-full
                    cursor-pointer
                    border-none
                    bg-transparent
                    px-4
                    py-2
                    text-left
                    text-sm
                    text-black
                    transition-colors
                    hover:bg-[#e3f2fd]
                    focus:bg-[#e3f2fd]
                    focus:outline-none
                  "
                >
                  URLの取得
                </button>
              </li>
  
                <li
                  className="m-0 p-0"
                  onClick={closeMenu}
                >
                  <ServerConnectButton
                    className="w-full py-2"
                  />
                </li>
  
                <li className="m-0 p-0">
                  <button
                    id="devtools"
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      handleOpenDevTools(
                        closeMenu,
                      );
                    }}
                    className="
                      w-full
                      cursor-pointer
                      whitespace-nowrap
                      border-none
                      bg-[#515152]
                      px-4
                      py-2
                      text-white
                      transition-colors
                      hover:bg-[#2196f3]
                      focus:bg-[#2196f3]
                      focus:outline-none
                    "
                  >
                    デベロッパー
                  </button>
                </li>
              </>
            )}

            <li
              className="my-1 border-t border-gray-200"
              role="separator"
            />
            <li className="m-0 p-0">
              {/* 自動ログイン */}
              <AutoLoginButton 
                className="
                  flex
                  w-full
                  cursor-pointer
                  items-center
                  gap-2
                  border-none
                  bg-blue-400
                  px-4
                  py-2
                  text-left
                  text-sm
                  text-white
                  transition-colors
                  hover:bg-blue-500
                  focus:outline-none
                "
              />
            </li>
            <li className="m-0 p-0">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleWindowAction(
                  closeMenu,
                  window.api?.minimizeWindow,
                  '最小化',
                )}
                className={windowMenuButtonClass}
              >
                <MinusIcon className="h-4 w-4" aria-hidden="true" />
                <span>最小化</span>
              </button>
            </li>

            <li className="m-0 p-0">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleWindowAction(
                  closeMenu,
                  window.api?.toggleMaximizeWindow,
                  '最大化 / 復元',
                )}
                className={windowMenuButtonClass}
              >
                <ArrowsPointingOutIcon className="h-4 w-4" aria-hidden="true" />
                <span>最大化 / 復元</span>
              </button>
            </li>

            <li className="m-0 p-0">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleWindowAction(
                  closeMenu,
                  window.api?.reloadWindow,
                  'リロード',
                )}
                className={windowMenuButtonClass}
              >
                <ArrowPathIcon className="h-4 w-4" aria-hidden="true" />
                <span>リロード</span>
              </button>
            </li>

            <li className="m-0 p-0">
              <button
                type="button"
                role="menuitem"
                onClick={() => handleWindowAction(
                  closeMenu,
                  window.api?.quitApp,
                  'アプリ終了',
                )}
                className={`${windowMenuButtonClass} text-red-700 hover:bg-red-50 focus:bg-red-50`}
              >
                <PowerIcon className="h-4 w-4" aria-hidden="true" />
                <span>アプリを終了</span>
              </button>
            </li>
          </ul>
        )}
      </PortalDropdown>
    );
  }
