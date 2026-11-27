// renderer/src/hooks/useTabs/common/activateTab.js
// タブをアクティブにする共通関数

import { setActiveWebview } from '@/utils/webview/webviewState.js'
import { restoreFocusAfterWebviewAction } from './restoreFocusAfterWebviewAction.js'

/**
 * タブをアクティブにする共通関数
 * @param {string} targetId - アクティブにするwebviewのID
 */
export function activateTab(targetId) {
  void 0;
  const tabsContainer = document.getElementById('tabs')
  const content = document.getElementById('content')

  if (!tabsContainer || !content) return

  // すべてのタブから active-tab クラスを削除
  tabsContainer.querySelectorAll('button').forEach(btn => {
    btn.classList.remove('active-tab')
  })

  // すべての webview を非表示
  document.querySelectorAll('webview').forEach(v => {
    v.classList.add('hidden')
  })

  // 対象の webview を表示
  const targetView = document.getElementById(targetId)
  if (targetView) {
    targetView.classList.remove('hidden')

    // ★ active webview 設定
    setActiveWebview(targetView)

    // ★ URL を安全にログ出力
    try {
      const maybe = targetView.getURL?.()
      if (typeof maybe === 'string') {
        void 0
      } else if (maybe && typeof maybe.then === 'function') {
        maybe.then(url => {
          void 0
        })
      } else {
        const fallback = targetView.getAttribute?.('src')
        void 0
      }
    } catch (e) {
      console.warn('⚠️ activateTab URL 取得失敗:', e)
    }

    // タブボタンに active-tab クラスを追加
    const tabBtn = tabsContainer.querySelector(
      `button[data-target="${targetId}"]`
    )
    if (tabBtn) {
      tabBtn.classList.add('active-tab')
    }

    // 🔍 対策: webviewへの切り替え後、renderer側（メモ欄など）へ
    //          明示的にフォーカスを戻す。AIタブ側で行っていた処理と同等のもの。
    restoreFocusAfterWebviewAction()
  }
}

/**
 * id="hugview-first-button" を持つタブボタンを
 * 強制的にアクティブにする関数
 */
export function activateHugViewFirstButton() {
  void 0;
  const hugButton = document.getElementById('hugview-first-button')

  if (!hugButton) {
    console.warn('⚠️ hugview-first-button が見つかりません')
    return
  }

  // data-target 属性から targetId を取得
  const targetId = hugButton.getAttribute('data-target')

  if (!targetId) {
    console.warn('⚠️ hugview-first-button に data-target 属性が見つかりません')
    return
  }

  activateTab(targetId)
}