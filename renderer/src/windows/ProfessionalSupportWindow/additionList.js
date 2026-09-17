import { URL_TARGET3 } from './constants'

/**
 * HUGのログイン済みWebViewセッション上で
 * record_proceedings.php へPOSTし、専門的支援実施加算(ID=55)の一覧を取得する。
 */
export const buildAdditionListFetchScript = ({ facilityId, targetDate }) => {
  const [year = '', month = ''] = targetDate
    ? targetDate.split('-').map(Number)
    : []

  const request = {
    url: URL_TARGET3,
    facilityId: String(facilityId ?? ''),
    year: String(year || ''),
    month: String(month || ''),
  }

  return `
    (async () => {
      const request = ${JSON.stringify(request)};

      const normalizeText = (value) =>
        String(value ?? '').replace(/\\s+/g, ' ').trim();

      const toJapaneseDate = (year, month, day) =>
        String(year) + '年' + String(month).padStart(2, '0') + '月' + String(day).padStart(2, '0') + '日';

      const getMonthLastDay = (year, month) =>
        new Date(Number(year), Number(month), 0).getDate();

      const parseRows = (doc) => {
        const table = Array.from(doc.querySelectorAll('table.table')).find((candidate) => {
          const headings = Array.from(candidate.querySelectorAll('thead th'))
            .map((th) => normalizeText(th.textContent));

          return headings.includes('児童名') &&
            headings.includes('加算名／タイトル') &&
            headings.includes('実施日');
        });

        if (!table) return [];

        return Array.from(table.querySelectorAll('tbody > tr')).map((row) => {
          const cells = Array.from(row.querySelectorAll(':scope > td'));
          const detailOnClick = cells[0]?.querySelector('button')?.getAttribute('onclick') ?? '';
          const idMatch = detailOnClick.match(/[?&]id=(\\d+)/);
          const signed = Boolean(
            cells[8]?.querySelector('img[src*="sign-icon"], img') ||
            normalizeText(cells[8]?.textContent)
          );

          return {
            id: idMatch?.[1] ?? '',
            childName: normalizeText(cells[1]?.textContent),
            additionName: normalizeText(cells[2]?.textContent),
            facilityName: normalizeText(cells[3]?.textContent),
            serviceName: normalizeText(cells[4]?.textContent),
            recorderName: normalizeText(cells[5]?.textContent),
            interviewDate: normalizeText(cells[6]?.textContent),
            status: normalizeText(cells[7]?.textContent),
            signed,
            lastUpdated: normalizeText(cells[9]?.textContent),
          };
        }).filter((item) => item.id || item.childName || item.interviewDate);
      };

      const initialResponse = await fetch(request.url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!initialResponse.ok) {
        throw new Error(
          '各種加算・議事録管理画面を取得できませんでした (HTTP ' +
            initialResponse.status +
            ')'
        );
      }

      const initialHtml = await initialResponse.text();
      const initialDoc = new DOMParser().parseFromString(initialHtml, 'text/html');

      const csrfToken = String(
        initialDoc.querySelector('input[name="csrf_token_from_client"]')?.value ?? ''
      ).trim();

      const modeToken = String(
        initialDoc.querySelector('input[name="mode_token"]')?.value ?? 'nomode'
      ).trim() || 'nomode';

      if (!csrfToken) {
        throw new Error(
          '各種加算・議事録管理画面のCSRFトークンを取得できませんでした。HUGのログイン状態を確認してください。'
        );
      }

      if (!request.facilityId) {
        const checkedFacility = initialDoc.querySelector(
          'input[name^="f_ary["]:checked, input[name^="f_ary["]'
        );
        request.facilityId = String(checkedFacility?.value ?? '').trim();
      }

      if (!request.facilityId) {
        throw new Error('一覧取得対象の施設IDを取得できませんでした。');
      }

      if (!request.year || !request.month) {
        const startDate = String(
          initialDoc.querySelector('input[name="interview_date"]')?.value ?? ''
        );
        const match = startDate.match(/(\\d{4})年(\\d{1,2})月/);

        if (match) {
          request.year = match[1];
          request.month = match[2];
        }
      }

      if (!request.year || !request.month) {
        throw new Error('一覧取得対象の年月を取得できませんでした。');
      }

      const lastDay = getMonthLastDay(request.year, request.month);
      const startDate = toJapaneseDate(request.year, request.month, 1);
      const endDate = toJapaneseDate(request.year, request.month, lastDay);

      const body = new URLSearchParams();
      body.set('mode', 'search');
      body.set('mode_token', modeToken);
      body.set('csrf_token_from_client', csrfToken);
      body.set('f_ary[' + request.facilityId + ']', request.facilityId);
      body.set('c_id', '0');
      body.set('search', '');
      body.set('interview_date', startDate);
      body.set('interview_date_end', endDate);
      body.set('s_ary[1]', '放課後等デイサービス');
      body.set('s_ary[2]', '児童発達支援');
      body.set('adding_children_id', '55');
      body.set('recorder', '');

      const response = await fetch(request.url, {
        method: 'POST',
        credentials: 'include',
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(
          '専門的支援一覧の取得に失敗しました (HTTP ' + response.status + ')'
        );
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const firstPageRows = parseRows(doc);
      const totalText = normalizeText(
        Array.from(doc.querySelectorAll('.ibox-title.sm h5, .ibox-title h5'))
          .map((node) => node.textContent)
          .find((text) => /全部で\\d+件/.test(text)) ?? ''
      );
      const totalMatch = totalText.match(/全部で(\\d+)件/);
      const total = totalMatch ? Number(totalMatch[1]) : firstPageRows.length;

      const pageNumbers = Array.from(doc.querySelectorAll('.pagination a'))
        .map((a) => {
          const href = a.getAttribute('href') ?? '';
          const match = href.match(/[?&]page=(\\d+)/);
          return match ? Number(match[1]) : null;
        })
        .filter((page) => Number.isFinite(page));

      const maxPage = Math.max(1, ...pageNumbers);
      const records = [...firstPageRows];

      // POST検索条件はHUG側セッションに保持されるため、2ページ目以降はpage指定で取得する。
      for (let page = 2; page <= maxPage; page += 1) {
        const pageUrl = request.url + '?page=' + page;
        const pageResponse = await fetch(pageUrl, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!pageResponse.ok) {
          throw new Error(
            '専門的支援一覧の' + page + 'ページ目を取得できませんでした (HTTP ' +
              pageResponse.status +
              ')'
          );
        }

        const pageHtml = await pageResponse.text();
        const pageDoc = new DOMParser().parseFromString(pageHtml, 'text/html');
        records.push(...parseRows(pageDoc));
      }

      const uniqueRecords = Array.from(
        new Map(
          records.map((record, index) => {
            const uniqueKey = record.id
              ? 'id:' + record.id
              : [
                  'fallback',
                  record.childName,
                  record.interviewDate,
                  record.facilityName,
                  record.recorderName,
                  record.lastUpdated,
                  index,
                ].join('|');

            return [uniqueKey, record];
          })
        ).values()
      );

      return {
        facilityId: request.facilityId,
        year: Number(request.year),
        month: Number(request.month),
        startDate,
        endDate,
        total: Math.min(total, uniqueRecords.length),
        pageCount: maxPage,
        records: uniqueRecords,
      };
    })()
  `
}
