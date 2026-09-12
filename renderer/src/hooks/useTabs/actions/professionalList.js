// renderer/src/hooks/useTabs/actions/professionalList.js

import {
  createWebview,
  createTabButton,
  activateTab,
  closeTab,
} from '../common/index.js'

import { getDateString } from '@/utils/date/dateUtils.js'
import { confirmDialog } from '@/utils/dialog/confirmDialog.js'

export function addProfessionalSupportListAction(appState, space) {
  const tabsContainer =
    document.getElementById('tabs')

  const webviewContainer =
    document.getElementById('webview-container')

  if (!tabsContainer || !webviewContainer) {
    console.error(
      '❌ tabs または webview-container が見つかりません'
    )
    return
  }

  const newId =
    `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  console.log('専門的支援一覧起動')
  console.log('🔍 日付', appState.CURRENT_YMD)

  // 月初日を作成
  const monthStartYmd =
    `${appState.CURRENT_YMD.slice(0, 8)}01`

  // 表示用フォーマット:
  // 2026-06-01 → 2026年06月01日
  function formatYmdToJapanese(ymd) {
    const [year, month, day] = ymd.split('-')
    return `${year}年${month}月${day}日`
  }

  const currentYmdJa =
    formatYmdToJapanese(
      appState.CURRENT_YMD
    )

  const monthStartYmdJa =
    formatYmdToJapanese(
      monthStartYmd
    )

  console.log('🔍 月初日', monthStartYmdJa)
  console.log('🔍 日付', currentYmdJa)

  const newWebview = createWebview(
    newId,
    'https://www.hug-ayumu.link/hug/wm/record_proceedings.php'
  )

  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    `専門的加算 一覧 : ${space?.childName}`,
    appState.closeButtonsVisible
  )

  if (!tabButton) {
    newWebview.remove()
    return
  }

  tabsContainer.appendChild(tabButton)

  tabButton.addEventListener(
    'click',
    () => activateTab(newId)
  )

  const closeBtn =
    tabButton.querySelector('.close-btn')

  if (closeBtn) {
    closeBtn.addEventListener(
      'click',
      async (event) => {
        event.stopPropagation()

        const shouldClose =
          await confirmDialog(
            'このタブを閉じますか？'
          )

        if (!shouldClose) {
          return
        }

        closeTab(newId)
      }
    )
  }

  let hasSearched = false

  newWebview.addEventListener(
    'did-finish-load',
    () => {
      if (hasSearched) return
      hasSearched = true

      newWebview.executeJavaScript(`
        try {
          const facilityId = "${appState.FACILITY_ID}";

          // 施設チェック
          const boxes = document.querySelectorAll(
            '#facility_check input[type="checkbox"]'
          );

          boxes.forEach((box) => {
            box.checked = box.value === facilityId;
          });

          // 専門的支援加算55を選択
          const selectSupport = document.querySelector(
            'select[name="adding_children_id"]'
          );

          if (selectSupport) {
            selectSupport.value = "55";
            selectSupport.dispatchEvent(
              new Event("change", {
                bubbles: true,
              })
            );
          }

          // 子ども選択
          const select =
            document.querySelector('#name_list');

          if (select) {
            select.dataset.cid =
              '${space?.childId}';

            select.value =
              '${space?.childId}';

            select.dispatchEvent(
              new Event('change', {
                bubbles: true,
              })
            );
          }

          // 日付を設定
          const startDateInput =
            document.getElementById("dp1");

          const endDateInput =
            document.getElementById("dp2");

          if (startDateInput) {
            startDateInput.value =
              "${monthStartYmdJa}";
          }

          if (endDateInput) {
            endDateInput.value =
              "${currentYmdJa}";
          }

          // 検索ボタン
          const searchBtn =
            document.querySelector(
              'button.btn.btn-sm.search[type="submit"]'
            );

          if (searchBtn) {
            searchBtn.click();
          }
        } catch (error) {
          console.error(
            "❌ 専門的支援一覧 初期化エラー:",
            error
          );
        }
      `)
    },
    {
      once: true,
    }
  )

  if (appState.DEBUG_FLG) {
    // DevTools（開発中のみ）
    newWebview.addEventListener(
      'dom-ready',
      () => {
        newWebview.openDevTools({
          mode: 'detach',
        })
      }
    )
  }

  activateTab(newId)
}