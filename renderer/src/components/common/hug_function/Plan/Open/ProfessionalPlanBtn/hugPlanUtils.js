import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'
import { isHugLoggedIn } from '@/hooks/useHugCache/isHugLoggedIn.js'

export const BASE = 'https://www.hug-ayumu.link/hug/wm/'
export function validateId(value, label) {
  const id = String(value ?? '').trim()
  if (!/^[1-9][0-9]*$/.test(id)) throw new Error(`${label}が不正です。`)
  return id
}

export async function executePlanResolver(resolver, args) {
  const webview = await getHugWebviewForCache()
  if (new URL(webview.getURL()).origin !== new URL(BASE).origin) throw new Error('HUG WebViewの接続先が不正です。')
  if (!await isHugLoggedIn(webview)) throw new Error('HUGにログインしてから実行してください。')
  const result = await webview.executeJavaScript(`(${runInWebview.toString()})(${JSON.stringify(BASE)}, ${resolver.toString()}, ${JSON.stringify(args)})`)
  const url = new URL(result)
  if (url.origin !== new URL(BASE).origin || url.searchParams.get('mode') !== 'detail' || !/^[0-9]+$/.test(url.searchParams.get('id') || '')) throw new Error('支援計画IDを取得できませんでした。')
  return url.href
}

async function runInWebview(base, resolver, args) {
  const origin = new URL(base).origin
  if (location.origin !== origin) throw new Error('HUGの接続先が変わりました。')
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 60000)
  async function getDocument(url, options = {}) {
    const response = await fetch(url, { credentials: 'include', cache: 'no-store', ...options, signal: controller.signal })
    if (new URL(response.url).origin !== origin) throw new Error('HUGの接続先が変わりました。')
    if (!response.ok) throw new Error(`HUG HTTP ${response.status}`)
    const doc = new DOMParser().parseFromString(await response.text(), 'text/html')
    if (doc.querySelector('input[name="username"], input[type="password"], input.btn-login') || new URL(response.url).pathname.endsWith('/login.php')) throw new Error('HUGに再ログインしてください。')
    return doc
  }
  function detailUrl(element, page) {
    let href = element.getAttribute('href')
    if (!href) href = (element.getAttribute('onclick') || '').match(/(?:window\.)?location\.href\s*=\s*(['"])(.*?)\1/)?.[2]
    if (!href) return null
    try {
      const url = new URL(href.replace(/&amp;/g, '&'), base)
      const expected = new URL(page, base)
      const id = url.searchParams.get('id')
      if (url.origin !== origin || url.pathname !== expected.pathname || !/^[0-9]+$/.test(id || '')) return null
      expected.search = new URLSearchParams({ mode: 'detail', id }).toString()
      return expected.href
    } catch { return null }
  }
  try { return await resolver({ base, getDocument, detailUrl }, args) }
  finally { clearTimeout(timer) }
}
