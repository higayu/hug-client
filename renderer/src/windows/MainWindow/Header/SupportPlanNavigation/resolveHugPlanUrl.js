import { getHugWebviewForCache } from '@/hooks/useHugCache/getHugCache.js'
import { isHugLoggedIn } from '@/hooks/useHugCache/isHugLoggedIn.js'

const BASE = 'https://www.hug-ayumu.link/hug/wm/'
const ORIGIN = new URL(BASE).origin

export async function resolveHugPlanUrl({ pageType, childId, facilityId }) {
  if (!['individual', 'specialized'].includes(pageType)) throw new Error('支援計画の種別が不正です。')
  if (!String(childId ?? '').trim()) throw new Error('児童が選択されていません。')
  const individual = pageType === 'individual'
  if (individual && !/^[1-8]$/.test(String(facilityId))) throw new Error('施設IDが不正です（旧仕様: 1～8）。')
  const webview = await getHugWebviewForCache()
  if (new URL(webview.getURL()).origin !== ORIGIN) throw new Error('HUG WebViewの接続先が不正です。')
  if (!await isHugLoggedIn(webview)) throw new Error('HUGにログインしてから実行してください。')

  const url = new URL(individual ? 'individual_situation.php' : 'addition_plan_situation.php', BASE)
  const options = { method: individual ? 'POST' : 'GET', credentials: 'include', cache: 'no-store' }
  if (individual) {
    options.headers = { 'Content-Type': 'application/x-www-form-urlencoded' }
    options.body = new URLSearchParams({ [`f_ary[${facilityId}]`]: String(facilityId), c_id: String(childId), indivisual_format: 'careplanmain', state: '1', mode: 'search' }).toString()
  } else {
    url.search = new URLSearchParams({ mode: 'list', c_id: String(childId) }).toString()
  }
  const result = await webview.executeJavaScript(`
    (async () => {
      if (location.origin !== ${JSON.stringify(ORIGIN)}) throw new Error('HUGの接続先が変わりました。');
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 20000);
      try {
        const res = await fetch(${JSON.stringify(url.href)}, { ...${JSON.stringify(options)}, signal: controller.signal });
        if (new URL(res.url).origin !== location.origin) throw new Error('HUGの接続先が変わりました。');
        if (!res.ok) throw new Error('一覧取得エラー: ' + res.status);
        const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
        if (doc.querySelector('input[name="username"], input[type="password"], input.btn-login') || new URL(res.url).pathname.endsWith('/login.php')) throw new Error('HUGに再ログインしてください。');
        const link = ${individual} ? doc.querySelector('body > div.contents > div.individualSituation.mb10.scrollX > table > tbody > tr:nth-child(1) > td.por > a') : [...doc.querySelectorAll('div.individualSituation table.table i')].find(el => el.textContent.trim() === '公開')?.closest('a');
        return link?.getAttribute('href') || null;
      } finally { clearTimeout(timer); }
    })()
  `)
  if (!result) throw new Error('対象の公開支援計画が見つかりません。')
  const link = new URL(result, BASE)
  const id = link.searchParams.get('id')
  if (link.origin !== ORIGIN || !id || !/^\d+$/.test(id)) throw new Error('支援計画IDを取得できませんでした。')
  const detail = new URL(individual ? 'individual_care-plan-main.php' : 'addition_plan.php', BASE)
  detail.search = new URLSearchParams({ mode: 'detail', id }).toString()
  return detail.href
}
