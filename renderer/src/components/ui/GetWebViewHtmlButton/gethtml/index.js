function findActiveWebview() {
  return [...document.querySelectorAll('webview')]
    .find((webview) => getComputedStyle(webview).visibility !== 'hidden')
}

export async function getActiveWebviewHtml() {
  const webview = findActiveWebview()

  if (typeof webview?.executeJavaScript !== 'function') {
    console.warn('[GetWebViewHtmlButton] activeなwebviewが見つかりません。')
    return null
  }

  try {
    const html = await webview.executeJavaScript(
      'document.documentElement?.outerHTML || ""',
    )

    void 0
    return html
  } catch (error) {
    console.warn(
      '[GetWebViewHtmlButton] activeなwebviewのHTMLを取得できませんでした。',
      error,
    )
    return null
  }
}
