import {
  CONTACT_BOOK_TABLE_SELECTOR,
  HUG_WM_BASE_URL,
  HUG_WM_CONTACT_BOOK_LIST_URL,
  PAGINATION_UL_SELECTOR,
} from '../shared/constants';
import { hugWmFetchText } from '../shared/fetch';
import type { HugPersonalRecord } from '../shared/types';

async function fetchContactBookNote(pathAndQuery: string): Promise<{
  note: string;
  user_id: number | null;
  staffName: string;
} | null> {
  const listUrl = new URL(pathAndQuery, HUG_WM_BASE_URL).href;

  try {
    const html = await hugWmFetchText(listUrl);
    const editDoc = new DOMParser().parseFromString(html, 'text/html');

    const staffSelect = editDoc.querySelector<HTMLSelectElement>(
      'select[name="record_staff"]',
    );

    if (!staffSelect) {
      throw new Error('記録者 select が見つかりませんでした');
    }

    const staffSelectValue = staffSelect.value;
    const staffName = staffSelect.selectedOptions[0]?.textContent?.trim() ?? '';

    console.log('記録者:', staffSelectValue, staffName);

    const textarea = editDoc.querySelector<HTMLTextAreaElement>(
      'textarea[name="note"][data-field-key="note"]',
    );

    if (!textarea) {
      throw new Error('note の textarea が見つかりませんでした');
    }

    return {
      note: textarea.value.trim(),
      user_id: Number.isFinite(Number(staffSelectValue)) ? Number(staffSelectValue) : null,
      staffName,
    };
  } catch (error) {
    console.error('[HUG WM] note取得エラー:', error);
    return null;
  }
}

function buildContactBookListUrl(params: {
  facilityId: number;
  date: string;
  dateEnd: string;
  childId?: number;
  page?: number;
}) {
  const url = new URL(HUG_WM_CONTACT_BOOK_LIST_URL);
  url.searchParams.set('f_id', String(params.facilityId));
  url.searchParams.set('date', params.date);
  url.searchParams.set('date_end', params.dateEnd);
  if (params.childId != null && params.childId > 0) {
    url.searchParams.set('id', String(params.childId));
  }
  if (params.page != null) {
    url.searchParams.set('page', String(params.page));
  }
  return url.href;
}

function getContactBookPageNumbers(doc: Document) {
  const targetUl = doc.querySelector(PAGINATION_UL_SELECTOR);

  if (!targetUl) {
    return [1];
  }

  const pages = new Set([1]);
  for (const anchor of Array.from(targetUl.querySelectorAll('a[href]'))) {
    const match = anchor.getAttribute('href')?.match(/[?&]page=(\d+)/);
    if (match) {
      pages.add(Number(match[1]));
    }
  }

  return [...pages].sort((a, b) => a - b);
}

async function fetchContactBookListDoc(listUrl: string) {
  const listHtml = await hugWmFetchText(listUrl);
  return new DOMParser().parseFromString(listHtml, 'text/html');
}

function findContactBookTable(doc: Document) {
  const table = doc.querySelector(CONTACT_BOOK_TABLE_SELECTOR);
  if (!table) {
    throw new Error(
      '対象テーブルが見つかりませんでした（HUGにログイン済みか、条件を確認してください）',
    );
  }
  return table;
}

function getAttendanceEditOnclicks(table: Element) {
  const rows = Array.from(table.querySelectorAll('tbody tr'));

  return rows
    .map((row) => {
      const cells = row.querySelectorAll('td');
      const dateText = cells[0]?.textContent?.trim() ?? '';
      const childName = cells[1]?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
      const attendanceText = cells[4]?.textContent?.trim() ?? '';

      if (attendanceText !== '出席') return null;

      const editButton = cells[7]?.querySelector('button.edit');
      const onclick = editButton?.getAttribute('onclick');
      if (!onclick) return null;

      return { date: dateText, childName, attendance: attendanceText, onclick };
    })
    .filter(Boolean) as { date: string; childName: string; attendance: string; onclick: string }[];
}

async function fetchNotesForAttendanceEdits(
  editOnclicks: { date: string; childName: string; attendance: string; onclick: string }[],
) {
  const records: HugPersonalRecord[] = [];

  for (const item of editOnclicks) {
    const editPath = item.onclick.match(/location\.href='([^']+)'/)?.[1];

    if (editPath) {
      const result = await fetchContactBookNote(editPath);

      records.push({
        date: item.date,
        childName: item.childName,
        attendance: item.attendance,
        note: result?.note ?? '',
        user_id: result?.user_id ?? null,
        staffName: result?.staffName ?? '',
      });
    }
  }

  return records;
}

async function processContactBookTableFromDoc(listDoc: Document) {
  const table = findContactBookTable(listDoc);
  const editOnclicks = getAttendanceEditOnclicks(table);
  return fetchNotesForAttendanceEdits(editOnclicks);
}

/** 連絡帳一覧から出席日の個人記録（note）を取得 */
export async function fetchHugPersonalRecordsFromWm(params: {
  facilityId: number;
  date: string;
  dateEnd: string;
  childId: number;
  onProgress?: (msg: string) => void;
}): Promise<HugPersonalRecord[]> {
  const { facilityId, date, dateEnd, childId, onProgress } = params;
  const listParams = { facilityId, date, dateEnd, childId };
  const allRecords: HugPersonalRecord[] = [];

  const probeUrl = buildContactBookListUrl(listParams);
  onProgress?.('一覧ページを取得しています…');
  const probeDoc = await fetchContactBookListDoc(probeUrl);
  const pages = getContactBookPageNumbers(probeDoc);

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    onProgress?.(`ページ ${page}/${pages.length} を処理中…`);

    const listUrl = buildContactBookListUrl({ ...listParams, page });
    const listDoc = i === 0 ? probeDoc : await fetchContactBookListDoc(listUrl);
    const pageRecords = await processContactBookTableFromDoc(listDoc);
    allRecords.push(...pageRecords);
  }

  return allRecords;
}
