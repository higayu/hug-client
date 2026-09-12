import {
  useEffect,
  useState,
} from 'react'
import { useSelector } from 'react-redux'

import './index.css'

import { useSettingsModal } from './useSettingsModal';

import {
  ApiTab,
  UrlTab,
  ConfigTab,
  UITab,
  WindowTab,
  CustomTab,
  UpdateTab,
  PromptTab,
  StaffTab,
  AdminTab,
  DebugTab,
  AutomationRulesTab,
} from "./tabs";

import { useAppState } from '@/AppStateContext';
import { ModalPortal } from '@/components/modals/ModalPortal';
import { selectLaravelAuth } from '@/store/slices/authSlice';

const DEFAULT_TAB_ID = 'api'

// ベースとなるタブ（常に表示）
const BASE_TABS = [
  {
    id: 'api',
    label: 'API設定',
    component: ApiTab,
  },
  {
    id: 'staff',
    label: '職員の設定',
    component: StaffTab,
  },
  {
    id: 'config',
    label: 'Config.json設定',
    component: ConfigTab,
  },
  {
    id: 'prompt',
    label: 'プロンプト',
    component: PromptTab,
  },
  {
    id: 'update',
    label: 'アップデート',
    component: UpdateTab,
  },

]

const ADMIN_TABS = [
  {
    id: 'automation-rules',
    label: '自動化ルール',
    component: AutomationRulesTab,
  },
  {
    id: 'admin',
    label: '職員管理',
    component: AdminTab,
  },
]

// デバッグモード用のタブ
const DEBUG_TABS = [
  {
    id: 'debug',
    label: '認証状態',
    component: DebugTab,
  },
  {
    id: 'url',
    label: 'URL設定',
    component: UrlTab,
  },
  {
    id: 'custom',
    label: 'カスタムボタン',
    component: CustomTab,
  },
  {
    id: 'ui',
    label: 'UI設定',
    component: UITab,
  },
  {
    id: 'window',
    label: 'ウィンドウ設定',
    component: WindowTab,
  },
]

export default function SettingsModal({
  isOpen,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState(DEFAULT_TAB_ID)
  const auth = useSelector(selectLaravelAuth)
  const isAdmin = Number(auth.user?.role_id) === 1

  /*
   * モーダルを開いた際に、
   * ini.json・config.json・カスタムボタンなどを読み込む。
   */
  const { isLoading } = useSettingsModal(isOpen)

  const {
    activeSidebarTab: activeTabFromState,
    setActiveSidebarTab: setActiveTabFromState,
    DEBUG_FLG,
  } = useAppState();

  // DEBUG_FLG に基づいて表示するタブを決定
  const visibleDebugTabs = isAdmin
    ? DEBUG_TABS
    : DEBUG_TABS.filter((tab) => tab.id !== 'debug')
  const baseTabs = isAdmin
    ? [...BASE_TABS, ...ADMIN_TABS]
    : BASE_TABS
  const tabs = DEBUG_FLG ? [...baseTabs, ...visibleDebugTabs] : baseTabs;

  /*
   * モーダルを開くたびにAPI設定タブへ戻す。
   */
  useEffect(() => {
    if (!isOpen) {
      return
    }

    setActiveTab(DEFAULT_TAB_ID)
  }, [isOpen])

  /*
   * ESCキーで閉じる。
   */
  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleEscapeKey = (event) => {
      if (event.key !== 'Escape') {
        return
      }

      onClose()
    }

    document.addEventListener('keydown', handleEscapeKey)

    return () => {
      document.removeEventListener('keydown', handleEscapeKey)
    }
  }, [isOpen, onClose])

  /*
   * モーダル背景をクリックした場合だけ閉じる。
   */
  const handleBackdropClick = (event) => {
    if (event.target !== event.currentTarget) {
      return
    }

    onClose()
  }

  // 現在アクティブなタブが存在しない場合は最初のタブに設定
  useEffect(() => {
    if (tabs.length > 0 && !tabs.find(tab => tab.id === activeTab)) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  if (!isOpen) {
    return null
  }

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-[2000] bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div
          className="settings-modal-container m-[2%] mx-auto flex max-h-[90vh] w-[90%] max-w-[1200px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl animate-modal-slide-in"
          style={{
            colorScheme: 'light',
          }}
          onClick={(event) => {
            event.stopPropagation()
          }}
        >
          <header className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#667eea] to-[#764ba2] p-5 text-white">
            <h2 className="m-0 text-2xl font-semibold">
              ⚙️ 設定編集
              {DEBUG_FLG && (
                <span className="ml-2 text-sm font-normal bg-yellow-400 text-black px-2 py-0.5 rounded">
                  DEBUG
                </span>
              )}
            </h2>

            <button
              type="button"
              aria-label="設定画面を閉じる"
              className="cursor-pointer border-none bg-transparent text-3xl font-bold leading-none text-white transition-opacity hover:opacity-70"
              onClick={onClose}
            >
              &times;
            </button>
          </header>

          <main className="relative min-h-0 flex-1 overflow-y-auto p-5 text-gray-900">
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
                <div className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-lg">
                  設定を読み込んでいます...
                </div>
              </div>
            )}

            <div
              role="tablist"
              aria-label="設定カテゴリ"
              className="mb-5 flex overflow-x-auto border-b-2 border-gray-200"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    id={`settings-tab-${tab.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-controls={`settings-panel-${tab.id}`}
                    tabIndex={isActive ? 0 : -1}
                    disabled={isLoading}
                    className={`shrink-0 cursor-pointer border-none border-b-[3px] bg-transparent px-5 py-3 text-sm font-medium transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                      isActive
                        ? 'border-b-blue-600 bg-gray-100 text-blue-600'
                        : 'border-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    }`}
                    onClick={() => {
                      setActiveTab(tab.id)
                    }}
                  >
                    {tab.label}
                    {DEBUG_FLG && DEBUG_TABS.some((debugTab) => debugTab.id === tab.id) && (
                      <span className="ml-1.5 rounded bg-purple-500 px-1.5 py-0.5 text-[10px] text-white">
                        DEV
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/*
             * 各タブのローカル入力状態を維持するため、
             * アンマウントせずhiddenで表示を切り替える。
             */}
            {tabs.map((tab) => {
              const TabComponent = tab.component
              const isActive = activeTab === tab.id

              return (
                <section
                  key={tab.id}
                  id={`settings-panel-${tab.id}`}
                  role="tabpanel"
                  aria-labelledby={`settings-tab-${tab.id}`}
                  hidden={!isActive}
                  className={isActive ? 'block' : 'hidden'}
                >
                  <TabComponent />
                </section>
              )
            })}
          </main>

          <footer className="flex shrink-0 justify-end border-t border-gray-200 bg-gray-100 p-4">
            <button
              id="close-settings"
              type="button"
              className="cursor-pointer rounded-md border-none bg-gray-600 px-5 py-2.5 font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-gray-700"
              onClick={onClose}
            >
              閉じる
            </button>
          </footer>
        </div>
      </div>
    </ModalPortal>
  )
}
