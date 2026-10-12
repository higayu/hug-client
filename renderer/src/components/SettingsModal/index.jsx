
import {
  useEffect,
  useMemo,
  useState,
} from 'react'

import {
  LockClosedIcon,
} from '@heroicons/react/24/outline'

import './index.css'

import { useSettingsModal } from './useSettingsModal'

import {
  ApiTab,
  UrlTab,
  ConfigTab,
  UITab,
  WindowTab,
  UpdateTab,
  PromptTab,
  StaffTab,
  AdminTab,
  DebugTab,
} from './tabs'

import { useAppState } from '@/AppStateContext'
import { ModalPortal } from '@/components/modals/ModalPortal'
import { useSettingsRoleAccess } from './useSettingsRoleAccess'

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

// 管理権限を持つユーザー用
const ADMIN_TABS = [
  {
    id: 'admin',
    label: '管理設定',
    icon: LockClosedIcon,
    component: AdminTab,
  },
]

// デバッグモード用
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

  /*
   * 新しい会社別権限
   *
   * isAdmin:
   *   グローバルadmin
   *
   * canManageCurrentCompanyStaff:
   *   選択中の会社に対して職員管理権限を持つ
   */
  const {
    isAdmin,
    canManageCurrentCompanyStaff,
  } = useSettingsRoleAccess()

  /*
   * グローバルadminは会社別roleがなくても
   * 管理設定を表示できる。
   */
  const canShowAdminTab =
    isAdmin || canManageCurrentCompanyStaff

  /*
   * モーダルを開いた際に設定を読み込む。
   */
  const { isLoading } = useSettingsModal(isOpen)

  const {
    DEBUG_FLG,
  } = useAppState()

  /*
   * 表示するタブ一覧を作成する。
   *
   * 管理設定:
   *   admin または会社別管理権限
   *
   * 認証状態:
   *   DEBUG_FLGが有効かつadminのみ
   */
  const tabs = useMemo(() => {
    const result = [...BASE_TABS]

    if (canShowAdminTab) {
      result.push(...ADMIN_TABS)
    }

    if (DEBUG_FLG) {
      const visibleDebugTabs = isAdmin
        ? DEBUG_TABS
        : DEBUG_TABS.filter((tab) => tab.id !== 'debug')

      result.push(...visibleDebugTabs)
    }

    return result
  }, [canShowAdminTab, isAdmin, DEBUG_FLG])

  /*
   * モーダルを開くたびにAPI設定へ戻す。
   */
  useEffect(() => {
    if (!isOpen) {
      return
    }

    setActiveTab(DEFAULT_TAB_ID)
  }, [isOpen])

  /*
   * ESCキーでモーダルを閉じる。
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

    document.addEventListener(
      'keydown',
      handleEscapeKey
    )

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscapeKey
      )
    }
  }, [isOpen, onClose])

  /*
   * モーダル背景をクリックした場合のみ閉じる。
   */
  const handleBackdropClick = (event) => {
    if (event.target !== event.currentTarget) {
      return
    }

    onClose()
  }

  /*
   * 権限変更などによって現在のタブが
   * 非表示になった場合、API設定へ戻す。
   */
  useEffect(() => {
    const existsActiveTab = tabs.some(
      (tab) => tab.id === activeTab
    )

    if (!existsActiveTab) {
      setActiveTab(DEFAULT_TAB_ID)
    }
  }, [tabs, activeTab])

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
          {/* ヘッダー */}
          <header className="flex shrink-0 items-center justify-between bg-gradient-to-r from-[#667eea] to-[#764ba2] p-5 text-white">
            <h2 className="m-0 text-2xl font-semibold">
              ⚙️ 設定編集

              {DEBUG_FLG && (
                <span className="ml-2 rounded bg-yellow-400 px-2 py-0.5 text-sm font-normal text-black">
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

          {/* メインコンテンツ */}
          <main className="relative min-h-0 flex-1 overflow-y-auto p-5 text-gray-900">
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
                <div className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-lg">
                  設定を読み込んでいます...
                </div>
              </div>
            )}

            {/* タブ一覧 */}
            <div
              role="tablist"
              aria-label="設定カテゴリ"
              className="mb-5 flex overflow-x-auto border-b-2 border-gray-200"
            >
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id
                const TabIcon = tab.icon

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
                    <span className="inline-flex items-center gap-1.5 align-middle">
                      {TabIcon && (
                        <TabIcon
                          className="h-4 w-4"
                          aria-hidden="true"
                        />
                      )}

                      <span>{tab.label}</span>
                    </span>

                    {DEBUG_FLG &&
                      DEBUG_TABS.some(
                        (debugTab) => debugTab.id === tab.id
                      ) && (
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
             * アンマウントせずhiddenで切り替える。
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

          {/* フッター */}
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
