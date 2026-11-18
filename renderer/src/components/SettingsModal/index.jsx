
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
  PromptTab,
  StaffTab,
  AdminTab,
  DebugTab,
  UpdateTab,
} from './tabs'

import { useAppState } from '@/AppStateContext'
import { useSelector } from 'react-redux'
import { selectIsCompanyAutomationEnabled } from '@/store/slices/authSlice'
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
    id: 'prompt',
    label: 'Prompt編集',
    component: PromptTab,
  },
  {
    id: 'staff',
    label: '職員の設定',
    component: StaffTab,
  },
  {
    id: 'config',
    label: 'ID・パスワードの設定',
    component: ConfigTab,
  },
  {
    id: 'update',
    label: 'アップデート',
    component: UpdateTab,
  },
]

// 管理権限を持つ職員向けのタブ
const ADMIN_TABS = [
  {
    id: 'admin',
    label: '管理設定',
    icon: LockClosedIcon,
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
  const isCompanyAutomationEnabled = useSelector(selectIsCompanyAutomationEnabled)

  // Laravel側の会社別権限を参照
  const {
    isAdmin,
    canAccessAdminTab,
  } = useSettingsRoleAccess()

  // 管理設定タブの表示権限
  // adminまたは職員管理権限を持つ職員に表示
  const canShowAdminTab = canAccessAdminTab

  /*
   * モーダルを開いた際に、
   * ini.json・config.jsonなどを読み込む。
   */
  const { isLoading } = useSettingsModal(isOpen)

  const {
    DEBUG_FLG,
  } = useAppState()

  /*
   * 表示対象のタブ一覧をメモ化する。
   *
   * 権限・DEBUG_FLGが変化した場合だけ
   * タブ配列を再生成する。
   */
  const tabs = useMemo(() => {
    // 管理タブの表示を制御
    const baseTabs = canShowAdminTab
      ? [...BASE_TABS, ...ADMIN_TABS]
      : BASE_TABS

    // デバッグモードが無効なら通常タブのみ
    if (!DEBUG_FLG) {
      return baseTabs
    }

    // 認証状態タブはadminのみ
    const visibleDebugTabs = isAdmin
      ? DEBUG_TABS
      : DEBUG_TABS.filter((tab) => tab.id !== 'debug')

    return [
      ...baseTabs,
      ...visibleDebugTabs,
    ]
  }, [
    canShowAdminTab,
    isAdmin,
    DEBUG_FLG,
  ])

  /*
   * モーダルを開くたびに
   * API設定タブへ戻す。
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
  }, [
    isOpen,
    onClose,
  ])

  /*
   * モーダル背景をクリックした場合だけ閉じる。
   */
  const handleBackdropClick = (event) => {
    if (event.target !== event.currentTarget) {
      return
    }

    onClose()
  }

  /*
   * 権限やDEBUG_FLGの変更によって
   * 現在のタブが非表示になった場合、
   * API設定タブへ切り替える。
   */
  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab(DEFAULT_TAB_ID)
    }
  }, [
    tabs,
    activeTab,
  ])

  // モーダルが閉じている場合は描画しない
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

              <span
                role="status"
                title="所属会社の自動化利用可否（サーバー側で管理）"
                className={`ml-3 inline-flex items-center rounded px-2 py-1 align-middle text-xs font-semibold text-white ${
                  isCompanyAutomationEnabled ? 'bg-green-700' : 'bg-red-700'
                }`}
              >
                モード：{isCompanyAutomationEnabled ? 'グレー版' : 'ホワイト版'}
              </span>

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
            {/* 設定読み込み中 */}
            {isLoading && (
              <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/80">
                <div className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-lg">
                  設定を読み込んでいます...
                </div>
              </div>
            )}

            {/* タブナビゲーション */}
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
                        ? 'settings-tab-active border-b-blue-700 bg-blue-100 text-blue-900 font-semibold shadow-sm hover:bg-blue-200 hover:text-blue-950'
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
