import { FACILITY_SELECT_SELECTOR, HUG_WM_ATTENDANCE_URL } from '../shared/constants';
import { hugWmFetchText } from '../shared/fetch';
import type { HugFacility } from '../shared/types';

function parseFacilitiesFromSelect(select: Element): HugFacility[] {
  return Array.from(select.querySelectorAll('option'))
    .map((option) => {
      const el = option as HTMLOptionElement;
      return {
        facility_id: Number(el.value.trim()),
        name: el.textContent?.trim() ?? '',
        selected: el.selected,
      };
    })
    .filter((f) => f.facility_id > 0 || f.name.length > 0)
    .filter((f) => Number.isFinite(f.facility_id) && f.facility_id > 0);
}

/** attendance.php の施設 select から事業所一覧を取得 */
export async function fetchFacilitiesFromHugWm(): Promise<HugFacility[]> {
  console.log('[HUG WM] 施設データ取得 fetch開始:', HUG_WM_ATTENDANCE_URL);

  const html = await hugWmFetchText(HUG_WM_ATTENDANCE_URL);
  const doc = new DOMParser().parseFromString(html, 'text/html');

  const facilitySelect = doc.querySelector(FACILITY_SELECT_SELECTOR);
  if (!facilitySelect) {
    throw new Error(
      '施設選択 select が見つかりません（HUG WM にログイン済みか確認してください）',
    );
  }

  const facilities = parseFacilitiesFromSelect(facilitySelect);
  console.log('[HUG WM] 施設データ:', facilities);
  return facilities;
}
