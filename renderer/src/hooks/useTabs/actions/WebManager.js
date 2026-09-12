// renderer/src/hooks/useTabs/actions/WebManager.js

import {
  createWebview,
  createTabButton,
  activateTab,
  closeTab,
} from '../common/index.js'

import { confirmDialog } from '@/utils/dialog/confirmDialog.js'

function getWebManagerUrl_kadai(iniState, childId) {
  return `${iniState?.apiSettings?.baseURL}/houday/build-file/yoshijima/childkadai-table?children_id=${childId}&record_type_id=1`
}

function getUrl(path) {
  return `${path}`
}

function getWebManagerUrl(iniState, path) {
  return `${iniState?.apiSettings?.baseURL}${path}`
}

export function addWebManagerAction(
  appState,
  iniState,
) {
  const tabsContainer =
    document.getElementById('tabs')

  const webviewContainer =
    document.getElementById(
      'webview-container',
    )

  if (!tabsContainer || !webviewContainer) {
    console.error(
      'tabs または webview-container が見つかりません',
    )
    return
  }

  const url = getWebManagerUrl(
    iniState,
    appState,
  )

  if (!url || url.includes('undefined')) {
    console.error(
      'WebManager URL の生成に失敗しました',
      {
        baseURL:
          iniState?.apiSettings?.baseURL,
        selectChild:
          childId,
        currentYmd:
          appState?.CURRENT_YMD,
      },
    )
    return
  }

  const newId =
    `hugview-${appState.CURRENT_YMD}-${document.querySelectorAll('webview').length}`

  const newWebview = createWebview(
    newId,
    url,
  )

  webviewContainer.appendChild(newWebview)

  const tabButton = createTabButton(
    newId,
    'データ確認',
    appState.closeButtonsVisible,
  )

  if (!tabButton) {
    newWebview.remove()
    return
  }

  tabsContainer.appendChild(tabButton)

  tabButton.addEventListener(
    'click',
    () => activateTab(newId),
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
            'このタブを閉じますか？',
          )

        if (!shouldClose) {
          return
        }

        closeTab(newId)
      },
    )
  }

  let initialized = false

  newWebview.addEventListener(
    'did-finish-load',
    () => {
      if (initialized) return
      initialized = true

      newWebview.executeJavaScript(`
      `)
    },
    {
      once: true,
    },
  )

  activateTab(newId)
}

export function addWebManagerAction_OutWindow(
  appState,
  iniState,
  switch_id,
  path = '',
  childId = '',
) {
  if (!childId) {
    console.error(
      'WebManager URL の生成に失敗しました: 児童が選択されていません',
    )
    return
  }

  let url = ''

  switch (switch_id) {
    case 1:
      url = getUrl(path)
      break

    case 2:
      url = getWebManagerUrl(
        iniState,
        path,
      )
      break

    default:
      url = getWebManagerUrl_kadai(
        iniState,
        childId,
      )
  }

  if (!url || url.includes('undefined')) {
    console.error(
      'WebManager URL の生成に失敗しました',
      {
        baseURL:
          iniState?.apiSettings?.baseURL,
        selectChild:
          childId,
        currentYmd:
          appState?.CURRENT_YMD,
      },
    )
    return
  }

  if (
    window.electronAPI?.openWebManagerPage
  ) {
    window.electronAPI.openWebManagerPage({
      url,
      title: 'Webページ',
    })
    return
  }

  window.open(
    url,
    '_blank',
    'noopener,noreferrer',
  )
}