import { executePlanResolver, validateId } from './hugPlanUtils.js'

export async function resolveProfessionalPlanUrl({ childId }) {
  return executePlanResolver(resolve, { childId: validateId(childId, '児童ID') })
}

async function resolve({ base, getDocument, detailUrl }, { childId }) {
  const listUrl = new URL('addition_plan_situation.php', base)
  listUrl.search = new URLSearchParams({ mode: 'list', c_id: childId }).toString()
  const list = await getDocument(listUrl.href)
  const table = list.querySelector('div.individualSituation table.table')
  if (!table) throw new Error('専門的支援計画の一覧がありません。')
  const candidates = new Set()
  for (const element of table.querySelectorAll('a[href]')) {
    const url = detailUrl(element, 'addition_plan.php')
    if (url) candidates.add(url)
  }
  for (const url of candidates) {
    const doc = await getDocument(url)
    const actualChild = doc.querySelector('input[name="c_id"]')?.value
    if (actualChild && actualChild !== childId) continue
    if (doc.querySelector('#carebreak')) return url
  }
  throw new Error('専門的支援計画の有効な詳細リンクが見つかりませんでした。')
}
