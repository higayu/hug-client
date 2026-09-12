// renderer/src/hooks/useTabs/actions/Monitoring.js

import { confirmDialog } from '@/utils/dialog/confirmDialog.js'

import {
  createWebview,
  createTabButton,
  activateTab,
  closeTab,
} from '../common/index.js'

// ============================================
// addMonitoringTabAction
// ============================================
export function addMonitoringTabAction(appState, space) {
  // ===============================
  // 児童選択チェック
  // ===============================
  if (!space?.childId) {
    alert('子どもを選択してください')
    return
  }

  // ===============================
  // コンテナ取得
  // ===============================
  const tabsContainer =
    document.getElementById('tabs')

  const webviewContainer =
    document.getElementById(
      'webview-container'
    )

  if (
    !tabsContainer ||
    !webviewContainer
  ) {
    console.error(
      '❌ tabs または webview-container が見つかりません'
    )

    return
  }

  // ===============================
  // WebView ID
  // ===============================
  const newId =
    `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  // ===============================
  // モニタリングページを開く
  // ===============================
  const newWebview =
    createWebview(
      newId,
      `https://www.hug-ayumu.link/hug/wm/individual_monitoring.php?mode=edit&c_id=${space?.childId}&f_id=${appState.FACILITY_ID}`
    )

  webviewContainer.appendChild(
    newWebview
  )

  // ===============================
  // タブ作成
  // ===============================
  const tabButton =
    createTabButton(
      newId,
      `モニタリング : ${space?.childName}`,
      appState.closeButtonsVisible
    )

  if (!tabButton) {
    return
  }

  tabsContainer.appendChild(
    tabButton
  )

  // ===============================
  // タブクリック
  // ===============================
  tabButton.addEventListener(
    'click',
    () => {
      activateTab(newId)
    }
  )

  // ===============================
  // タブを閉じる
  // ===============================
  const closeBtn =
    tabButton.querySelector(
      '.close-btn'
    )

  if (closeBtn) {
    closeBtn.addEventListener(
      'click',
      async (e) => {
        e.stopPropagation()

        const confirmed =
          await confirmDialog(
            'このタブを閉じますか？'
          )

        if (!confirmed) {
          return
        }

        closeTab(newId)
      }
    )
  }

  // ===============================
  // ページ読み込み後
  // #target までスクロール
  // ===============================
  newWebview.addEventListener(
    'did-finish-load',
    async () => {
      try {
        await newWebview.executeJavaScript(`
          (function () {
            const target =
              document.querySelector(
                '#target'
              )

            if (!target) {
              console.warn(
                '⚠️ #target が見つかりません'
              )

              return
            }

            target.scrollIntoView()

            console.log(
              '✅ #target までスクロールしました'
            )
          })();
        `)

      } catch (error) {
        console.error(
          '❌ スクロール処理に失敗しました',
          error
        )
      }
    },
    {
      once: true
    }
  )

  // ===============================
  // 作成したタブを表示
  // ===============================
  activateTab(newId)
}