import { executePlanResolver, validateId } from './hugPlanUtils.js'

export async function resolveIndividualPlanUrl({ childId, facilityId }) {
  return executePlanResolver(resolve, {
    childId: validateId(childId, '児童ID'),
    facilityId: validateId(facilityId, '施設ID'),
  })
}

async function resolve({ base, getDocument, detailUrl }, { childId, facilityId }) {
  const page = 'individual_care-plan-main.php'
  const body = new URLSearchParams({ mode: 'search', c_id: childId, children: childId, [`f_ary[${facilityId}]`]: facilityId })
  for (const status of [1, 2, 3]) body.set(`creation_status[${status}]`, String(status))
  const list = await getDocument(base + page, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString(),
  })
  const candidates = new Set()
  for (const element of list.querySelectorAll('#care_plan_table tbody tr a[href], #care_plan_table tbody tr button[onclick], #care_plan_table tbody tr input[onclick]')) {
    const raw = element.getAttribute('href') || (element.getAttribute('onclick') || '').match(/(?:window\.)?location\.href\s*=\s*(['"])(.*?)\1/)?.[2]
    if (!raw) continue
    try { if (new URL(raw.replace(/&amp;/g, '&'), base).searchParams.get('mode') !== 'detail') continue } catch { continue }
    const url = detailUrl(element, page)
    if (url) candidates.add(url)
  }
  for (const url of candidates) {
    const doc = await getDocument(url)
    const root = doc.querySelector('#carebreak')
    const actualChild = doc.querySelector('input[name="c_id"]')?.value
    if (actualChild && actualChild !== childId) continue
    if (root?.querySelector('h3') && root.querySelector('table')) return url
  }
  throw new Error('個別支援計画の有効な詳細リンクが見つかりませんでした。')
}
