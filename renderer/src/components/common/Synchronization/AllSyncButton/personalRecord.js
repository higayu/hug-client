import { URL_TARGET4 } from './constants'


/**
 * HUGの contact_book.php を通常GETし、#name_list から児童一覧を取得する。
 * 個人記録一覧POSTの前準備確認、およびLaravel児童同期テストで利用する。
 */
export const buildPersonalRecordChildrenFetchScript = ({ facilityId }) => {
  const request = {
    url: URL_TARGET4,
    facilityId: String(facilityId ?? ''),
  }

  return `
    (async () => {
      const request = ${JSON.stringify(request)};
      const normalizeText = (value) =>
        String(value ?? '').replace(/\\s+/g, ' ').trim();

      const response = await fetch(request.url, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(
          'サービス提供記録画面を取得できませんでした (HTTP ' +
            response.status +
            ')'
        );
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const select = doc.querySelector('#name_list');

      if (!select) {
        throw new Error('児童一覧 #name_list を取得できませんでした。');
      }

      const children = Array.from(select.querySelectorAll('option'))
        .map((option) => {
          const id = Number(String(option.value ?? '').trim());
          const rawName = normalizeText(option.textContent);

          if (!Number.isInteger(id) || id <= 0 || !rawName || rawName === '---') {
            return null;
          }

          return {
            id,
            name: rawName,
            is_delete: rawName.startsWith('[利用停止]') ? 1 : 0,
          };
        })
        .filter(Boolean);

      const checkedFacility = doc.querySelector(
        'input[name^="facility["]:checked, input[name^="facility["]'
      );

      return {
        requestedFacilityId: request.facilityId,
        facilityId: String(checkedFacility?.value ?? '').trim(),
        children,
        childCount: children.length,
      };
    })()
  `
}

/**
 * HUGのログイン済みWebViewセッション上で contact_book.php へPOSTし、
 * 指定施設・指定月のサービス提供記録（個人記録）一覧を取得する。
 *
 * 検証用のため、HUG側の検索結果を保存せずそのまま返す。
 */
export const buildPersonalRecordFetchScript = ({ facilityId, year, month, config = {} }) => {
  const request = {
    url: config?.url || URL_TARGET4,
    facilityId: String(facilityId ?? ''),
    year: String(year ?? ''),
    month: String(month ?? ''),
    config,
  }

  return `
    (async () => {
      const request = ${JSON.stringify(request)};
      const CONFIG = request.config || {};

      const normalizeText = (value) =>
        String(value ?? '').replace(/\\s+/g, ' ').trim();

      const pad2 = (value) => String(value).padStart(2, '0');

      const getLastDay = (year, month) =>
        new Date(Number(year), Number(month), 0).getDate();

      const toSlashDate = (year, month, day) =>
        String(year) + '/' + pad2(month) + '/' + pad2(day);

      const normalizeDate = (value) => {
        const match = String(value ?? '').match(/(\\d{4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})/);
        if (!match) return normalizeText(value);
        return match[1] + '-' + pad2(match[2]) + '-' + pad2(match[3]);
      };

      const parseRows = (doc) => {
        const table = Array.from(doc.querySelectorAll(CONFIG.tableSelector || 'table.table')).find((candidate) => {
          const headings = Array.from(candidate.querySelectorAll('thead th'))
            .map((th) => normalizeText(th.textContent));

          const requiredHeadings = Array.isArray(CONFIG.requiredHeadings)
            ? CONFIG.requiredHeadings
            : ['日付', '児童名', '施設名', '活動内容', '記録者', '最終更新'];
          return requiredHeadings.every((heading) => headings.includes(heading));
        });

        if (!table) return [];

        return Array.from(table.querySelectorAll('tbody > tr'))
          .map((row) => {
            const cells = Array.from(row.querySelectorAll(':scope > td'));
            if (cells.length < 4) return null;

            const columns = CONFIG.columns || {};
            const editIndex = Number.isInteger(columns.edit) ? columns.edit : 7;
            const editButton = cells[editIndex]?.querySelector(CONFIG.editSelector || 'button[onclick], a[href]');
            const editSource =
              editButton?.getAttribute('onclick') ??
              editButton?.getAttribute('href') ??
              '';

            const idMatch = editSource.match(/[?&]id=(\\d+)/);
            const childIdMatch = editSource.match(/[?&]c_id=(\\d+)/);
            const dateMatch = editSource.match(/[?&]cal_date=([0-9-]+)/);
            const recordKey =
              row.querySelector(CONFIG.recordKeySelector || '.editing-status-badge')
                ?.getAttribute(CONFIG.recordKeyAttribute || 'data-record-id') ?? '';

            const childNameIndex = Number.isInteger(columns.childName) ? columns.childName : 1;
            const facilityNameIndex = Number.isInteger(columns.facilityName) ? columns.facilityName : 2;
            const activityIndex = Number.isInteger(columns.activity) ? columns.activity : 3;
            const attendanceIndex = Number.isInteger(columns.attendance) ? columns.attendance : 4;
            const statusIndex = Number.isInteger(columns.status) ? columns.status : 5;
            const recorderIndex = Number.isInteger(columns.recorder) ? columns.recorder : 9;
            const updatedAtIndex = Number.isInteger(columns.updatedAt) ? columns.updatedAt : 10;
            const dateIndex = Number.isInteger(columns.date) ? columns.date : 0;

            const childName = normalizeText(cells[childNameIndex]?.textContent)
              .replace(/さん$/, '')
              .trim();

            const activity = normalizeText(cells[activityIndex]?.textContent);
            const attendance = normalizeText(cells[attendanceIndex]?.textContent);

            const statusCell = cells[statusIndex];
            const statusLabel = statusCell?.querySelector('span.label');
            const status = normalizeText(
              statusLabel?.textContent ?? statusCell?.textContent
            );
            const statusClass = statusLabel
              ? Array.from(statusLabel.classList)
                  .filter((className) => className !== 'label')
                  .join(' ')
              : '';

            const recorder = normalizeText(cells[recorderIndex]?.textContent);
            const updatedAt = normalizeText(cells[updatedAtIndex]?.textContent);

            return {
              recordId: idMatch?.[1] ?? '',
              childrenId: childIdMatch?.[1] ?? '',
              recordKey,
              date: normalizeDate(dateMatch?.[1] ?? cells[dateIndex]?.textContent),
              childName,
              facilityName: normalizeText(cells[facilityNameIndex]?.textContent),
              activity,
              attendance,
              status,
              statusClass,
              recorder,
              updatedAt,
              editSource,
            };
          })
          .filter((record) => record && (record.recordId || record.childrenId || record.childName));
      };

      const initialRequest = CONFIG.initialRequest || {};
      const initialResponse = await fetch(request.url, {
        method: initialRequest.method || 'GET',
        credentials: initialRequest.credentials || 'include',
        cache: initialRequest.cache || 'no-store',
      });

      if (!initialResponse.ok) {
        throw new Error(
          'サービス提供記録画面を取得できませんでした (HTTP ' +
            initialResponse.status +
            ')'
        );
      }

      const initialHtml = await initialResponse.text();
      const initialDoc = new DOMParser().parseFromString(initialHtml, 'text/html');
      const initialChildren = Array.from(
        initialDoc.querySelectorAll(CONFIG.childrenSelector || '#name_list option')
      )
        .map((option) => {
          const id = Number(String(option.value ?? '').trim());
          const name = normalizeText(option.textContent);

          if (!Number.isInteger(id) || id <= 0 || !name || name === '---') {
            return null;
          }

          return {
            id,
            name,
            is_delete: name.startsWith('[利用停止]') ? 1 : 0,
          };
        })
        .filter(Boolean);

      if (!request.facilityId) {
        const checkedFacility = initialDoc.querySelector(
          CONFIG.facilitySelector || 'input[name^="facility["]:checked, input[name^="facility["]'
        );
        request.facilityId = String(checkedFacility?.value ?? '').trim();
      }

      if (!request.year || !request.month) {
        const startDate = String(
          initialDoc.querySelector(CONFIG.defaultDateSelector || 'input[name="date"]')?.value ?? ''
        );
        const match = startDate.match(/(\\d{4})[\\/-](\\d{1,2})/);

        if (match) {
          request.year = match[1];
          request.month = match[2];
        }
      }

      if (!request.facilityId) {
        throw new Error('個人記録取得対象の施設IDを取得できませんでした。');
      }

      if (!request.year || !request.month) {
        throw new Error('個人記録取得対象の年月を取得できませんでした。');
      }

      const lastDay = getLastDay(request.year, request.month);
      const startDate = toSlashDate(request.year, request.month, 1);
      const endDate = toSlashDate(request.year, request.month, lastDay);

      const body = new URLSearchParams();
      const postFields = CONFIG.postFields || {};
      const fieldNames = CONFIG.postFieldNames || {};

      body.set('mode', postFields.mode ?? 'search');
      body.set('search', postFields.search ?? '');
      body.set(
        String(fieldNames.facility || 'facility[{{facilityId}}]').replace('{{facilityId}}', request.facilityId),
        request.facilityId
      );
      body.set('children', postFields.children ?? '0');
      body.set(fieldNames.startDate || 'date', startDate);
      body.set(fieldNames.endDate || 'date_end', endDate);
      body.set(fieldNames.service1 || 's_ary[1]', postFields.service1 ?? '放課後等デイサービス');
      body.set(fieldNames.service2 || 's_ary[2]', postFields.service2 ?? '児童発達支援');
      body.set('state', postFields.state ?? '');

      const searchRequest = CONFIG.searchRequest || {};
      const response = await fetch(request.url, {
        method: searchRequest.method || 'POST',
        credentials: searchRequest.credentials || 'include',
        cache: searchRequest.cache || 'no-store',
        headers: {
          'Content-Type': searchRequest.contentType || 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(
          '個人記録の取得に失敗しました (HTTP ' + response.status + ')'
        );
      }

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const firstPageRows = parseRows(doc);

      const totalText = normalizeText(
        Array.from(doc.querySelectorAll(
          Array.isArray(CONFIG.totalSelectors) && CONFIG.totalSelectors.length > 0
            ? CONFIG.totalSelectors.join(', ')
            : '.ibox-title.sm h5, .ibox-title h5'
        ))
          .map((node) => node.textContent)
          .find((text) => /全部で\\d+件/.test(text)) ?? ''
      );
      const totalMatch = totalText.match(/全部で(\\d+)件/);
      const total = totalMatch ? Number(totalMatch[1]) : firstPageRows.length;

      const pageSize = firstPageRows.length;
      const pageNumbers = Array.from(doc.querySelectorAll(CONFIG.paginationSelector || '.pagination a'))
        .map((a) => {
          const href = a.getAttribute('href') ?? '';
          const match = href.match(/[?&]page=(\\d+)/);
          return match ? Number(match[1]) : null;
        })
        .filter((page) => Number.isFinite(page));

      // ページリンクが途中までしか表示されない場合があるため、総件数からもページ数を算出する。
      const pageCountFromTotal = pageSize > 0 ? Math.ceil(total / pageSize) : 1;
      const pageCount = Math.max(1, pageCountFromTotal, ...pageNumbers);
      const records = [...firstPageRows];

      // POSTした検索条件はHUG側セッションに保持されるため、2ページ目以降はGETで取得する。
      for (let page = 2; page <= pageCount; page += 1) {
        const paginationParameter = CONFIG.paginationParameter || 'page';
        const pageUrl = new URL(request.url);
        pageUrl.searchParams.set(paginationParameter, String(page));
        const pageResponse = await fetch(pageUrl.toString(), {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!pageResponse.ok) {
          throw new Error(
            '個人記録の' + page + 'ページ目を取得できませんでした (HTTP ' +
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
            const key = record.recordId
              ? 'id:' + record.recordId
              : [
                  'fallback',
                  record.childrenId,
                  record.date,
                  record.facilityName,
                  record.childName,
                  index,
                ].join('|');

            return [key, record];
          })
        ).values()
      );

      return {
        facilityId: request.facilityId,
        year: Number(request.year),
        month: Number(request.month),
        startDate,
        endDate,
        total,
        pageCount,
        hugChildren: initialChildren,
        hugChildCount: initialChildren.length,
        records: uniqueRecords,
      };
    })()
  `
}
