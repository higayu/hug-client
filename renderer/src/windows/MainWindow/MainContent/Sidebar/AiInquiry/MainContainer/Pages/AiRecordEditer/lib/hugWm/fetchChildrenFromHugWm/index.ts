import { HUG_WM_CHILD_AGREEMENT_FILTER_URL } from '../shared/constants';
import { hugWmFetch } from '../shared/fetch';
import type { HugChild } from '../shared/types';

function buildChildAgreementFilterParams(facilityId: number, targetDate: string) {
  const params = new URLSearchParams();
  params.set(`f_ary[${facilityId}]`, String(facilityId));
  params.set('furigana', '0');
  params.set('parent_flg', 'false');
  params.set('target_date', targetDate);
  return params;
}

function parseChildrenFromAgreementFilterResponse(text: string): HugChild[] {
  const trimmed = text.trim();

  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    try {
      const data = JSON.parse(trimmed) as
        | HugChild[]
        | { children?: HugChild[]; child_list?: HugChild[]; list?: HugChild[] };
      const list = Array.isArray(data)
        ? data
        : data.children || data.child_list || data.list || [];

      return list
        .map((item) => ({
          child_id: Number(
            (item as { child_id?: number; id?: number; c_id?: number; value?: number }).child_id ??
              (item as { id?: number }).id ??
              (item as { c_id?: number }).c_id ??
              (item as { value?: number }).value,
          ),
          name: String(
            (item as { name?: string; child_name?: string; text?: string }).name ??
              (item as { child_name?: string }).child_name ??
              (item as { text?: string }).text ??
              '',
          ).trim(),
        }))
        .filter((c) => Number.isFinite(c.child_id) && c.child_id > 0);
    } catch {
      // HTML として続行
    }
  }

  const parseOptions = (doc: Document) =>
    Array.from(doc.querySelectorAll('option'))
      .map((opt) => ({
        child_id: Number((opt as HTMLOptionElement).value),
        name: opt.textContent?.trim() ?? '',
      }))
      .filter((c) => Number.isFinite(c.child_id) && c.child_id > 0);

  const htmlDoc = new DOMParser().parseFromString(trimmed, 'text/html');
  const fromHtml = parseOptions(htmlDoc);
  if (fromHtml.length > 0) {
    return fromHtml;
  }

  const wrappedDoc = new DOMParser().parseFromString(
    `<select>${trimmed}</select>`,
    'text/html',
  );
  return parseOptions(wrappedDoc);
}

/** ajax_child_agreement_filter.php に POST して児童一覧を取得 */
export async function fetchChildrenFromHugWm(params: {
  facilityId: number;
  date: string;
  dateEnd?: string;
  childId?: number;
}): Promise<HugChild[]> {
  const today = new Date().toISOString().split('T')[0];
  const facilityId = params.facilityId;
  const targetDate = params.date || today;

  if (!Number.isFinite(facilityId) || facilityId <= 0) {
    throw new Error('facilityId が不正です');
  }

  const body = buildChildAgreementFilterParams(facilityId, targetDate);
  console.log(
    '[HUG WM] ajax_child_agreement_filter POST:',
    Object.fromEntries(Array.from(body.entries())),
  );

  const text = await hugWmFetch(HUG_WM_CHILD_AGREEMENT_FILTER_URL, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      'X-Requested-With': 'XMLHttpRequest',
    },
    body: body.toString(),
  });

  return parseChildrenFromAgreementFilterResponse(text);
}
