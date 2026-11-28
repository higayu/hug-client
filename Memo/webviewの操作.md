# アクティブなWebViewの操作

```bash
import { getActiveWebview } from '@/utils/webviewState.js'

  const vw = getActiveWebview();

    await vw.executeJavaScript(`
        document.querySelector('input[name="username"]').value = ${JSON.stringify(appState.HUG_USERNAME)};
        document.querySelector('input[name="password"]').value = ${JSON.stringify(appState.HUG_PASSWORD)};
        const checkbox = document.querySelector('input[name="setexpire"]');
        if (checkbox && !checkbox.checked) checkbox.click();
        document.querySelector("input.btn-login")?.click();
    `)
```

# 新しいWebViewの作成
```bash
// renderer/src/hooks/useTabs/actions/normal.js

import { createWebview, createTabButton, activateTab, closeTab } from '../common/index.js'

export function addNormalTabAction(appState) {
  false && ('🔍 [useTabs] ＋ボタンがクリックされました')

  const tabsContainer = document.getElementById('tabs')
  const webviewContainer = document.getElementById('webview-container')

  if (!tabsContainer || !webviewContainer) {
    console.error('❌ tabs または webview-container が見つかりません')
    return
  }

  const newId = `hugview-${Date.now()}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    `https://www.hug-ayumu.link/hug/wm/attendance.php?mode=detail&f_id=${appState.FACILITY_ID}&date=${appState.CURRENT_YMD}`
  )

  webviewContainer.appendChild(newWebview)

  const index = tabsContainer.querySelectorAll("button[data-target^='hugview']").length + 1
  const tabButton = createTabButton(newId, `Hug-${index}`, appState.closeButtonsVisible)

  if (!tabButton) return

  // 追加ボタンの前に挿入
  const addTabBtn = document.getElementById('add-tab-btn')
  if (addTabBtn) tabsContainer.insertBefore(tabButton, addTabBtn)
  else tabsContainer.appendChild(tabButton)

  // --- クリックで切り替え ---
  tabButton.addEventListener('click', () => activateTab(newId))

  // --- 閉じる処理 ---
  const closeBtn = tabButton.querySelector('.close-btn')
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!confirm('このタブを閉じますか？')) return
      closeTab(newId)
    })
  }

  activateTab(newId)
}
```

# URLの取得
```bash
import { getActiveWebview } from '@/utils/webviewState.js'

  const vw = getActiveWebview()
  const url = vw && typeof vw.getURL === 'function' ? vw.getURL() : ''
  false && ('URLの値',url);
```
