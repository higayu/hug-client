// renderer/src/hooks/useTabs/common/createWebview.js
// webviewを作成する共通関数

/**
 * webviewを作成する共通関数
 * @param {string} id - webviewのID
 * @param {string} src - webviewのURL
 * @param {Object} attributes - 追加の属性
 * @returns {HTMLElement} 作成されたwebview要素
 */
export function createWebview(id, src, attributes = {}) {
  const webview = document.createElement('webview')
  webview.id = id
  // webviewのURLを設定
  webview.src = src
  webview.setAttribute('allowpopups', 'true')
  webview.setAttribute('disablewebsecurity', 'true')
  
  if (window.preloadPath) {
    webview.setAttribute('preload', window.preloadPath)
  }
  
  Object.entries(attributes).forEach(([key, value]) => {
    webview.setAttribute(key, value)
  })
  
  webview.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;z-index:20;pointer-events:auto;'
  webview.classList.add('hidden')
  
  // consoleメッセージを転送
  webview.addEventListener('console-message', (e) => {
    console.log(`🪶 [${webview.id}] ${e.message}`)
  })
  
  return webview
}
