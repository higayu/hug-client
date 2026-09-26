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
      const doc = new DOMParser().parseFromString(
        html,
        'text/html'
      );

      const select = doc.querySelector('#name_list');

      if (!select) {
        throw new Error(
          '児童一覧 #name_list を取得できませんでした。'
        );
      }

      const children = Array.from(
        select.querySelectorAll('option')
      )
        .map((option) => {
          const id = Number(
            String(option.value ?? '').trim()
          );

          const rawName = normalizeText(
            option.textContent
          );

          if (
            !Number.isInteger(id) ||
            id <= 0 ||
            !rawName ||
            rawName === '---'
          ) {
            return null;
          }

          return {
            id,
            name: rawName,
            is_delete: rawName.startsWith(
              '[利用停止]'
            )
              ? 1
              : 0,
          };
        })
        .filter(Boolean);

      const checkedFacility = doc.querySelector(
        'input[name^="facility["]:checked, input[name^="facility["]'
      );

      return {
        requestedFacilityId: request.facilityId,
        facilityId: String(
          checkedFacility?.value ?? ''
        ).trim(),
        children,
        childCount: children.length,
      };
    })()
  `
}

/**
 * HUGのログイン済みWebViewセッション上で
 * contact_book.php へ検索条件をPOSTし、
 * 指定施設・指定月のサービス提供記録（個人記録）一覧を取得する。
 *
 * 重要:
 * HUG側は検索条件やページ位置をセッションに保持するため、
 * 検索POSTのレスポンスを「1ページ目」とは扱わない。
 *
 * 処理:
 * 1. contact_book.php GET
 * 2. 検索条件POST
 * 3. contact_book.php?page=1 を明示GET
 * 4. page=1から総件数・ページ数を取得
 * 5. page=2～最終ページをGET
 * 6. recordIdで重複排除
 * 7. HUG総件数と取得件数を検証
 */
export const buildPersonalRecordFetchScript = ({
  facilityId,
  year,
  month,
  config = {},
}) => {
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
        String(value ?? '')
          .replace(/\\s+/g, ' ')
          .trim();

      const pad2 = (value) =>
        String(value).padStart(2, '0');

      const getLastDay = (year, month) =>
        new Date(
          Number(year),
          Number(month),
          0
        ).getDate();

      const toSlashDate = (
        year,
        month,
        day
      ) =>
        String(year) +
        '/' +
        pad2(month) +
        '/' +
        pad2(day);

      const normalizeDate = (value) => {
        const match = String(
          value ?? ''
        ).match(
          /(\\d{4})[\\/-](\\d{1,2})[\\/-](\\d{1,2})/
        );

        if (!match) {
          return normalizeText(value);
        }

        return (
          match[1] +
          '-' +
          pad2(match[2]) +
          '-' +
          pad2(match[3])
        );
      };

      /**
       * ログイン画面へ飛ばされていないか確認する。
       */
      const assertNotLoginPage = (
        doc,
        html,
        contextLabel
      ) => {
        const hasPasswordInput =
          !!doc.querySelector(
            'input[type="password"]'
          );

        const title =
          normalizeText(doc.title);

        const looksLikeLogin =
          hasPasswordInput ||
          title.includes('ログイン') ||
          String(html ?? '').includes(
            'login.php'
          );

        if (looksLikeLogin) {
          throw new Error(
            contextLabel +
              'でHUGのログイン画面が返されました。'
          );
        }
      };

      /**
       * 個人記録テーブルを解析する。
       */
      const parseRows = (doc) => {
        const table = Array.from(
          doc.querySelectorAll(
            CONFIG.tableSelector ||
              'table.table'
          )
        ).find((candidate) => {
          const headings = Array.from(
            candidate.querySelectorAll(
              'thead th'
            )
          ).map((th) =>
            normalizeText(th.textContent)
          );

          const requiredHeadings =
            Array.isArray(
              CONFIG.requiredHeadings
            )
              ? CONFIG.requiredHeadings
              : [
                  '日付',
                  '児童名',
                  '施設名',
                  '活動内容',
                  '記録者',
                  '最終更新',
                ];

          return requiredHeadings.every(
            (heading) =>
              headings.includes(heading)
          );
        });

        if (!table) {
          return [];
        }

        return Array.from(
          table.querySelectorAll(
            'tbody > tr'
          )
        )
          .map((row) => {
            const cells = Array.from(
              row.querySelectorAll(
                ':scope > td'
              )
            );

            if (cells.length < 4) {
              return null;
            }

            const columns =
              CONFIG.columns || {};

            const editIndex =
              Number.isInteger(
                columns.edit
              )
                ? columns.edit
                : 7;

            const editButton =
              cells[
                editIndex
              ]?.querySelector(
                CONFIG.editSelector ||
                  'button[onclick], a[href]'
              );

            const editSource =
              editButton?.getAttribute(
                'onclick'
              ) ??
              editButton?.getAttribute(
                'href'
              ) ??
              '';

            const idMatch =
              editSource.match(
                /[?&]id=(\\d+)/
              );

            const childIdMatch =
              editSource.match(
                /[?&]c_id=(\\d+)/
              );

            const dateMatch =
              editSource.match(
                /[?&]cal_date=([0-9-]+)/
              );

            const recordKey =
              row
                .querySelector(
                  CONFIG.recordKeySelector ||
                    '.editing-status-badge'
                )
                ?.getAttribute(
                  CONFIG.recordKeyAttribute ||
                    'data-record-id'
                ) ?? '';

            const childNameIndex =
              Number.isInteger(
                columns.childName
              )
                ? columns.childName
                : 1;

            const facilityNameIndex =
              Number.isInteger(
                columns.facilityName
              )
                ? columns.facilityName
                : 2;

            const activityIndex =
              Number.isInteger(
                columns.activity
              )
                ? columns.activity
                : 3;

            const attendanceIndex =
              Number.isInteger(
                columns.attendance
              )
                ? columns.attendance
                : 4;

            const statusIndex =
              Number.isInteger(
                columns.status
              )
                ? columns.status
                : 5;

            const recorderIndex =
              Number.isInteger(
                columns.recorder
              )
                ? columns.recorder
                : 9;

            const updatedAtIndex =
              Number.isInteger(
                columns.updatedAt
              )
                ? columns.updatedAt
                : 10;

            const dateIndex =
              Number.isInteger(
                columns.date
              )
                ? columns.date
                : 0;

            const childName =
              normalizeText(
                cells[
                  childNameIndex
                ]?.textContent
              )
                .replace(/さん$/, '')
                .trim();

            const activity =
              normalizeText(
                cells[
                  activityIndex
                ]?.textContent
              );

            const attendance =
              normalizeText(
                cells[
                  attendanceIndex
                ]?.textContent
              );

            const statusCell =
              cells[statusIndex];

            const statusLabel =
              statusCell?.querySelector(
                'span.label'
              );

            const status =
              normalizeText(
                statusLabel?.textContent ??
                  statusCell?.textContent
              );

            const statusClass =
              statusLabel
                ? Array.from(
                    statusLabel.classList
                  )
                    .filter(
                      (className) =>
                        className !==
                        'label'
                    )
                    .join(' ')
                : '';

            const recorder =
              normalizeText(
                cells[
                  recorderIndex
                ]?.textContent
              );

            const updatedAt =
              normalizeText(
                cells[
                  updatedAtIndex
                ]?.textContent
              );

            return {
              recordId:
                idMatch?.[1] ?? '',

              childrenId:
                childIdMatch?.[1] ??
                '',

              recordKey,

              date: normalizeDate(
                dateMatch?.[1] ??
                  cells[
                    dateIndex
                  ]?.textContent
              ),

              childName,

              facilityName:
                normalizeText(
                  cells[
                    facilityNameIndex
                  ]?.textContent
                ),

              activity,
              attendance,
              status,
              statusClass,
              recorder,
              updatedAt,
              editSource,
            };
          })
          .filter(
            (record) =>
              record &&
              (
                record.recordId ||
                record.childrenId ||
                record.childName
              )
          );
      };

      /**
       * 「全部で263件」のような表示から
       * HUG側の総件数を取得する。
       */
      const getTotalCount = (
        doc,
        fallback = 0
      ) => {
        const selectors =
          Array.isArray(
            CONFIG.totalSelectors
          ) &&
          CONFIG.totalSelectors.length >
            0
            ? CONFIG.totalSelectors
            : [
                '.ibox-title.sm h5',
                '.ibox-title h5',
              ];

        const totalText =
          normalizeText(
            Array.from(
              doc.querySelectorAll(
                selectors.join(', ')
              )
            )
              .map(
                (node) =>
                  node.textContent
              )
              .find((text) =>
                /全部で\\s*\\d+\\s*件/.test(
                  normalizeText(text)
                )
              ) ?? ''
          );

        const totalMatch =
          totalText.match(
            /全部で\\s*(\\d+)\\s*件/
          );

        if (!totalMatch) {
          return Number(fallback) || 0;
        }

        return Number(
          totalMatch[1]
        );
      };

      /**
       * ページネーションHTMLから最大ページ番号を取得。
       *
       * HUGでは
       * contact_book.php?page=1
       * contact_book.php?page=2
       * ...
       * の形式。
       */
      const getPaginationPageNumbers = (
        doc
      ) => {
        const selector =
          CONFIG.paginationSelector ||
          '.pagination a';

        return Array.from(
          doc.querySelectorAll(selector)
        )
          .map((anchor) => {
            const href =
              anchor.getAttribute(
                'href'
              ) ?? '';

            const match =
              href.match(
                /[?&]page=(\\d+)/
              );

            if (!match) {
              return null;
            }

            const page =
              Number(match[1]);

            return Number.isInteger(
              page
            ) && page > 0
              ? page
              : null;
          })
          .filter(
            (page) =>
              Number.isInteger(page)
          );
      };

      const getMaxPageFromDocument = (
        doc
      ) => {
        const pageNumbers =
          getPaginationPageNumbers(
            doc
          );

        return pageNumbers.length > 0
          ? Math.max(
              1,
              ...pageNumbers
            )
          : 1;
      };

      /**
       * 検索後の特定ページを明示的にGETする。
       */
      const fetchPage = async (
        page
      ) => {
        const paginationParameter =
          CONFIG.paginationParameter ||
          'page';

        const pageUrl =
          new URL(request.url);

        pageUrl.searchParams.set(
          paginationParameter,
          String(page)
        );

        const response =
          await fetch(
            pageUrl.toString(),
            {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            }
          );

        if (!response.ok) {
          throw new Error(
            '個人記録の' +
              page +
              'ページ目を取得できませんでした (HTTP ' +
              response.status +
              ')'
          );
        }

        const html =
          await response.text();

        const doc =
          new DOMParser().parseFromString(
            html,
            'text/html'
          );

        assertNotLoginPage(
          doc,
          html,
          '個人記録 ' +
            page +
            'ページ目取得'
        );

        return {
          page,
          url: pageUrl.toString(),
          html,
          doc,
          rows: parseRows(doc),
        };
      };

      /*
       * ========================================
       * 1. 初期画面GET
       * ========================================
       */

      const initialRequest =
        CONFIG.initialRequest || {};

      const initialResponse =
        await fetch(request.url, {
          method:
            initialRequest.method ||
            'GET',

          credentials:
            initialRequest.credentials ||
            'include',

          cache:
            initialRequest.cache ||
            'no-store',
        });

      if (!initialResponse.ok) {
        throw new Error(
          'サービス提供記録画面を取得できませんでした (HTTP ' +
            initialResponse.status +
            ')'
        );
      }

      const initialHtml =
        await initialResponse.text();

      const initialDoc =
        new DOMParser().parseFromString(
          initialHtml,
          'text/html'
        );

      assertNotLoginPage(
        initialDoc,
        initialHtml,
        'サービス提供記録初期画面取得'
      );

      /*
       * ========================================
       * 2. HUG児童一覧取得
       * ========================================
       */

      const initialChildren =
        Array.from(
          initialDoc.querySelectorAll(
            CONFIG.childrenSelector ||
              '#name_list option'
          )
        )
          .map((option) => {
            const id = Number(
              String(
                option.value ?? ''
              ).trim()
            );

            const name =
              normalizeText(
                option.textContent
              );

            if (
              !Number.isInteger(id) ||
              id <= 0 ||
              !name ||
              name === '---'
            ) {
              return null;
            }

            return {
              id,
              name,

              is_delete:
                name.startsWith(
                  '[利用停止]'
                )
                  ? 1
                  : 0,
            };
          })
          .filter(Boolean);

      /*
       * ========================================
       * 3. 施設ID補完
       * ========================================
       */

      if (!request.facilityId) {
        const checkedFacility =
          initialDoc.querySelector(
            CONFIG.facilitySelector ||
              'input[name^="facility["]:checked, input[name^="facility["]'
          );

        request.facilityId =
          String(
            checkedFacility?.value ??
              ''
          ).trim();
      }

      /*
       * ========================================
       * 4. 年月補完
       * ========================================
       */

      if (
        !request.year ||
        !request.month
      ) {
        const defaultDate =
          String(
            initialDoc.querySelector(
              CONFIG.defaultDateSelector ||
                'input[name="date"]'
            )?.value ?? ''
          );

        const match =
          defaultDate.match(
            /(\\d{4})[\\/-](\\d{1,2})/
          );

        if (match) {
          request.year =
            match[1];

          request.month =
            match[2];
        }
      }

      if (!request.facilityId) {
        throw new Error(
          '個人記録取得対象の施設IDを取得できませんでした。'
        );
      }

      if (
        !request.year ||
        !request.month
      ) {
        throw new Error(
          '個人記録取得対象の年月を取得できませんでした。'
        );
      }

      /*
       * ========================================
       * 5. 検索期間作成
       * ========================================
       */

      const lastDay =
        getLastDay(
          request.year,
          request.month
        );

      const startDate =
        toSlashDate(
          request.year,
          request.month,
          1
        );

      const endDate =
        toSlashDate(
          request.year,
          request.month,
          lastDay
        );

      /*
       * ========================================
       * 6. 検索POSTデータ作成
       * ========================================
       */

      const body =
        new URLSearchParams();

      const postFields =
        CONFIG.postFields || {};

      const fieldNames =
        CONFIG.postFieldNames || {};

      body.set(
        'mode',
        postFields.mode ??
          'search'
      );

      body.set(
        'search',
        postFields.search ?? ''
      );

      body.set(
        String(
          fieldNames.facility ||
            'facility[{{facilityId}}]'
        ).replace(
          '{{facilityId}}',
          request.facilityId
        ),
        request.facilityId
      );

      body.set(
        'children',
        postFields.children ?? '0'
      );

      body.set(
        fieldNames.startDate ||
          'date',
        startDate
      );

      body.set(
        fieldNames.endDate ||
          'date_end',
        endDate
      );

      body.set(
        fieldNames.service1 ||
          's_ary[1]',
        postFields.service1 ??
          '放課後等デイサービス'
      );

      body.set(
        fieldNames.service2 ||
          's_ary[2]',
        postFields.service2 ??
          '児童発達支援'
      );

      body.set(
        'state',
        postFields.state ?? ''
      );

      /*
       * ========================================
       * 7. 検索条件POST
       *
       * 重要:
       * このレスポンスを1ページ目として使用しない。
       *
       * HUG側セッションへ検索条件を保存することだけが目的。
       * ========================================
       */

      const searchRequest =
        CONFIG.searchRequest || {};

      const searchResponse =
        await fetch(request.url, {
          method:
            searchRequest.method ||
            'POST',

          credentials:
            searchRequest.credentials ||
            'include',

          cache:
            searchRequest.cache ||
            'no-store',

          headers: {
            'Content-Type':
              searchRequest.contentType ||
              'application/x-www-form-urlencoded;charset=UTF-8',
          },

          body: body.toString(),
        });

      if (!searchResponse.ok) {
        throw new Error(
          '個人記録の検索条件設定に失敗しました (HTTP ' +
            searchResponse.status +
            ')'
        );
      }

      /*
       * bodyを消費しておく。
       *
       * 内容自体は一覧データとして使用しない。
       */
      const searchHtml =
        await searchResponse.text();

      const searchDoc =
        new DOMParser().parseFromString(
          searchHtml,
          'text/html'
        );

      assertNotLoginPage(
        searchDoc,
        searchHtml,
        '個人記録検索POST'
      );

      /*
       * ========================================
       * 8. 必ず page=1 をGET
       * ========================================
       */

      const firstPage =
        await fetchPage(1);

      const firstPageRows =
        firstPage.rows;

      /*
       * ========================================
       * 9. 総件数取得
       * ========================================
       */

      const total =
        getTotalCount(
          firstPage.doc,
          firstPageRows.length
        );

      /*
       * ========================================
       * 10. 最大ページ数取得
       *
       * まずHTMLのpaginationを信用する。
       *
       * ただしページネーションが
       * 1 2 3 4 5 のように一部しか出ないケースも
       * 想定して、1ページあたり件数と総件数からも
       * ページ数を補完する。
       * ========================================
       */

      const firstPageSize =
        firstPageRows.length;

      const maxPageFromHtml =
        getMaxPageFromDocument(
          firstPage.doc
        );

      const pageCountFromTotal =
        total > 0 &&
        firstPageSize > 0
          ? Math.ceil(
              total /
                firstPageSize
            )
          : 1;

      const pageCount =
        Math.max(
          1,
          maxPageFromHtml,
          pageCountFromTotal
        );

      /*
       * ========================================
       * 11. page=1を起点に一覧を作成
       * ========================================
       */

      const records = [
        ...firstPageRows,
      ];

      const pageDebug = [
        {
          page: 1,
          rowCount:
            firstPageRows.length,
          url: firstPage.url,
        },
      ];

      /*
       * ========================================
       * 12. page=2 ～ 最終ページをGET
       * ========================================
       */

      for (
        let page = 2;
        page <= pageCount;
        page += 1
      ) {
        const pageResult =
          await fetchPage(page);

        pageDebug.push({
          page,
          rowCount:
            pageResult.rows.length,
          url: pageResult.url,
        });

        records.push(
          ...pageResult.rows
        );
      }

      /*
       * ========================================
       * 13. 重複排除
       * ========================================
       *
       * 原則 recordId をキーにする。
       *
       * recordIdがない特殊行についてのみ、
       * 児童ID・日付・施設・児童名・editSource
       * を使ったfallbackキーを生成する。
       *
       * indexをfallbackキーへ含めると
       * 同じデータでも重複排除できないため使用しない。
       * ========================================
       */

      const uniqueMap =
        new Map();

      for (
        const record of records
      ) {
        const key =
          record.recordId
            ? 'id:' +
              record.recordId
            : [
                'fallback',
                record.childrenId,
                record.date,
                record.facilityName,
                record.childName,
                record.editSource,
              ].join('|');

        if (
          !uniqueMap.has(key)
        ) {
          uniqueMap.set(
            key,
            record
          );
        }
      }

      const uniqueRecords =
        Array.from(
          uniqueMap.values()
        );

      /*
       * ========================================
       * 14. 件数整合性チェック
       * ========================================
       *
       * HUGに「全部でN件」と出ている場合、
       * 実取得件数が一致しなければ後続処理へ進めない。
       * ========================================
       */

      if (
        Number.isFinite(total) &&
        total >= 0 &&
        uniqueRecords.length !==
          total
      ) {
        throw new Error(
          '個人記録一覧の取得件数が一致しません。' +
            ' HUG側=' +
            total +
            '件' +
            ' / 実取得=' +
            uniqueRecords.length +
            '件' +
            ' / 生データ=' +
            records.length +
            '件' +
            ' / pageCount=' +
            pageCount
        );
      }

      /*
       * ========================================
       * 15. 完了
       * ========================================
       */

      return {
        facilityId:
          request.facilityId,

        year:
          Number(
            request.year
          ),

        month:
          Number(
            request.month
          ),

        startDate,
        endDate,

        total,

        pageCount,

        rawRecordCount:
          records.length,

        recordCount:
          uniqueRecords.length,

        pageDebug,

        hugChildren:
          initialChildren,

        hugChildCount:
          initialChildren.length,

        records:
          uniqueRecords,
      };
    })()
  `
}