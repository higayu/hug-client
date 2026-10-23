function withTimeout(promise, timeoutMs, message) {
  let timerId
  const timeoutPromise = new Promise((_, reject) => {
    timerId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })
  return Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timerId))
}

export async function getActiveWebviewHtml(getWebview) {
  // TaskWindowが管理する選択中のWebView以外にはフォールバックしない。
  const webview = typeof getWebview === 'function' ? getWebview() : null
  if (typeof webview?.executeJavaScript !== 'function') {
    console.warn('[GetWebViewHtmlButton] 選択中のwebviewが見つかりません。')
    return null
  }

  try {
    const html = await withTimeout(
      webview.executeJavaScript('document.documentElement?.outerHTML || ""'),
      5000,
      'WebView HTML取得が5秒以内に完了しませんでした',
    )
    if (typeof html !== 'string' || !html.trim()) {
      throw new Error('WebViewからHTMLが取得できませんでした')
    }
    console.log('[GetWebViewHtmlButton] selected webview HTML:', html)
    return html
  } catch (error) {
    console.warn('[GetWebViewHtmlButton] HTMLを取得できませんでした。', error)
    return null
  }
}

function htmlFilename() {
  const stamp = new Date().toLocaleString('sv-SE', { hour12: false })
    .replace(' ', '_').replace(/:/g, '-')
  return `webview_${stamp}.html`
}

export async function downloadActiveWebviewHtml(getWebview) {
  const html = await getActiveWebviewHtml(getWebview)
  if (html === null) return false

  const blob = new Blob(['\uFEFF', html], { type: 'text/html;charset=utf-8' })
  const blobUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = blobUrl
  anchor.download = htmlFilename()
  anchor.style.display = 'none'

  try {
    document.body.appendChild(anchor)
    anchor.click()
    console.info('[GetWebViewHtmlButton] HTMLのダウンロードを開始しました:', anchor.download)
    return true
  } catch (error) {
    console.error('[GetWebViewHtmlButton] ダウンロードに失敗しました。', error)
    return false
  } finally {
    anchor.remove()
    // Chromiumがダウンロードを開始する時間を確保する
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
  }
}
