// renderer/src/hooks/useTabs/index.js

import {
  useEffect,
  useCallback,
  useRef,
} from 'react'
import { useSelector } from 'react-redux'
import { selectActiveSpaceId, selectSpace } from '@/store/slices/chilledspaceSlice.js'

import {
  useAppState,
} from '@/AppStateContext'

import {
  setActiveWebview,
} from '@/utils/webview/webviewState.js'

import {
  activateTab,
  closeTab,
  clearActiveWebviewCache,
} from './common/index.js'

import {
  addNormalTabAction,
} from './actions/normal.js'

import {
  addPersonalRecordTabAction4,
} from './actions/personalRecord'

import {
  addMonitoringTabAction,
} from './actions/monitoring'

import {
  addProfessionalSupportListAction,
} from './actions/professionalList.js'

import {
  addProfessionalSupportNewAction3,
  addProfessionalSupportCheckAction,
} from './actions/professionalNew.js'

// useTabs() は複数コンポーネントから呼ばれるため、
// 初期化はアプリ全体で1回だけ行う
let tabsSystemInitialized = false

export function useTabs(spaceId) {
  const {
    appState,
  } = useAppState()

  const activeSpaceId = useSelector(selectActiveSpaceId)
  const effectiveSpaceId = spaceId || activeSpaceId
  const space = useSelector(selectSpace(effectiveSpaceId))

  const tabsInitializedRef =
    useRef(false)

  // ============================================
  // 通常タブ
  // ============================================
  const addNormalTab =
    useCallback(
      () => {
        addNormalTabAction(
          appState
        )
      },
      [
        appState,
        space,
      ]
    )

  // ============================================
  // 個人記録タブ
  // ============================================
  const addPersonalRecordTab =
    useCallback(
      () => {
        addPersonalRecordTabAction4(
          appState,
          space
        )
      },
      [
        appState,
        space,
      ]
    )

  // ============================================
  // モニタリングタブ
  // ============================================
  const addMonitoringTab =
    useCallback(
      () => {
        addMonitoringTabAction(
          appState,
          space
        )
      },
      [
        appState,
        space,
      ]
    )

  // ============================================
  // 専門的支援一覧
  // ============================================
  const addProfessionalSupportListTab =
    useCallback(
      () => {
        addProfessionalSupportListAction(
          appState,
          space
        )
      },
      [
        appState,
        space,
      ]
    )

  // ============================================
  // 専門的支援確認
  // ============================================
  const addProfessionalSupportCheckTab =
    useCallback(
      () => {
        addProfessionalSupportCheckAction(
          appState,
          space
        )
      },
      [
        appState,
        space,
      ]
    )

  // ============================================
  // 専門的支援新規
  // ============================================
  const addProfessionalSupportNewTab =
    useCallback(
      () => {
        addProfessionalSupportNewAction3(
          appState,
          space
        )
      },
      [
        appState,
        space,
      ]
    )

  // ============================================
  // タブクリック
  // ============================================
  useEffect(
    () => {
      const tabsContainer =
        document.getElementById(
          'tabs'
        )

      if (!tabsContainer) {
        return
      }

      const handleTabClick =
        (e) => {
          const tab =
            e.target.closest(
              'button[data-target]'
            )

          if (!tab) {
            return
          }

          activateTab(
            tab.dataset.target
          )
        }

      tabsContainer.addEventListener(
        'click',
        handleTabClick
      )

      return () => {
        tabsContainer.removeEventListener(
          'click',
          handleTabClick
        )
      }
    },
    []
  )

  // ============================================
  // タブシステム初期化
  // ============================================
  useEffect(
    () => {
      if (
        tabsInitializedRef.current
      ) {
        const addTabBtn =
          document.getElementById(
            'add-tab-btn'
          )

        if (addTabBtn) {
          const newAddTabBtn =
            addTabBtn.cloneNode(
              true
            )

          addTabBtn.parentNode
            ?.replaceChild(
              newAddTabBtn,
              addTabBtn
            )

          newAddTabBtn
            .addEventListener(
              'click',
              addNormalTab
            )

          newAddTabBtn
            .addEventListener(
              'contextmenu',
              (e) => {
                e.preventDefault()

                window.electronAPI
                  .Open_NowDayPage({
                    facilityId:
                      appState.FACILITY_ID,

                    dateStr:
                      appState.CURRENT_YMD,
                  })
              }
            )
        }

        return
      }

      tabsInitializedRef.current =
        true

      if (
        tabsSystemInitialized
      ) {
        return
      }

      tabsSystemInitialized =
        true

      // ========================================
      // デフォルトWebView
      // ========================================
      const defaultWebview =
        document.getElementById(
          'hugview'
        )

      if (defaultWebview) {
        setActiveWebview(
          defaultWebview
        )
      }

      // ========================================
      // tabs取得
      // ========================================
      const tabsContainer =
        document.getElementById(
          'tabs'
        )

      if (!tabsContainer) {
        return
      }

      // ========================================
      // + ボタン
      // ========================================
      let addTabBtn =
        document.getElementById(
          'add-tab-btn'
        )

      if (!addTabBtn) {
        addTabBtn =
          document.createElement(
            'button'
          )

        addTabBtn.id =
          'add-tab-btn'

        addTabBtn.textContent =
          '+'

        addTabBtn.className =
          'px-2 py-1 text-white cursor-pointer rounded transition-colors duration-200 hover:bg-[#777] hover:text-white border-none bg-transparent text-black font-bold'

        tabsContainer.appendChild(
          addTabBtn
        )
      }

      // ========================================
      // 左クリック
      // ========================================
      addTabBtn.addEventListener(
        'click',
        addNormalTab
      )

      // ========================================
      // 右クリック
      // ========================================
      const handleContextMenu =
        (e) => {
          e.preventDefault()

          window.electronAPI
            .Open_NowDayPage({
              facilityId:
                appState.FACILITY_ID,

              dateStr:
                appState.CURRENT_YMD,
            })
        }

      addTabBtn.addEventListener(
        'contextmenu',
        handleContextMenu
      )

      // #kojin-kiroku / #professional-support 等は
      // 各Reactコンポーネントの onClick で処理する。
      // DOMリスナーと併用すると二重発火するため、
      // ここでは登録しない。

      return () => {
        if (addTabBtn) {
          addTabBtn.removeEventListener(
            'click',
            addNormalTab
          )

          addTabBtn.removeEventListener(
            'contextmenu',
            handleContextMenu
          )
        }
      }
    },
    [
      addNormalTab,
      appState.FACILITY_ID,
      appState.CURRENT_YMD,
    ]
  )

  // ============================================
  // 公開
  // ============================================
  return {
    addNormalTab,
    addPersonalRecordTab,

    // ★ 追加
    addMonitoringTab,

    addProfessionalSupportListTab,
    addProfessionalSupportNewTab,
    addProfessionalSupportCheckTab,

    activateTab,
    closeTab,
    clearActiveWebviewCache,
  }
}