import { URL_TARGET3 } from './constants'

/**
 * HUGのログイン済みWebViewセッション上で
 * record_proceedings.php へPOSTし、
 * 専門的支援実施加算(ID=55)の一覧を取得する。
 *
 * 注意:
 * HUG側では検索条件や現在ページがセッションに保持される可能性があるため、
 * POSTレスポンスを「必ず1ページ目」とは扱わない。
 *
 * POSTで検索条件を設定したあと、
 * page=1 ～ 最終ページを明示的にGETして一覧を取得する。
 */
export const buildAdditionListFetchScript = ({
  facilityId,
  targetDate,
}) => {
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
        String(value ?? '')
          .replace(/\\s+/g, ' ')
          .trim();

      const toJapaneseDate = (year, month, day) =>
        String(year) +
        '年' +
        String(month).padStart(2, '0') +
        '月' +
        String(day).padStart(2, '0') +
        '日';

      const getMonthLastDay = (year, month) =>
        new Date(
          Number(year),
          Number(month),
          0
        ).getDate();

      /**
       * 一覧テーブルから専門的支援実施加算の行を抽出する。
       */
      const parseRows = (doc) => {
        const table = Array
          .from(doc.querySelectorAll('table.table'))
          .find((candidate) => {
            const headings = Array
              .from(candidate.querySelectorAll('thead th'))
              .map((th) =>
                normalizeText(th.textContent)
              );

            return (
              headings.includes('児童名') &&
              headings.includes('加算名／タイトル') &&
              headings.includes('実施日')
            );
          });

        if (!table) {
          return [];
        }

        return Array
          .from(
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

            const detailOnClick =
              cells[0]
                ?.querySelector('button')
                ?.getAttribute('onclick') ??
              '';

            const idMatch =
              detailOnClick.match(
                /[?&]id=(\\d+)/
              );

            const signed = Boolean(
              cells[8]?.querySelector(
                'img[src*="sign-icon"], img'
              ) ||
              normalizeText(
                cells[8]?.textContent
              )
            );

            return {
              id: idMatch?.[1] ?? '',

              childName:
                normalizeText(
                  cells[1]?.textContent
                ),

              additionName:
                normalizeText(
                  cells[2]?.textContent
                ),

              facilityName:
                normalizeText(
                  cells[3]?.textContent
                ),

              serviceName:
                normalizeText(
                  cells[4]?.textContent
                ),

              recorderName:
                normalizeText(
                  cells[5]?.textContent
                ),

              interviewDate:
                normalizeText(
                  cells[6]?.textContent
                ),

              status:
                normalizeText(
                  cells[7]?.textContent
                ),

              signed,

              lastUpdated:
                normalizeText(
                  cells[9]?.textContent
                ),
            };
          })
          .filter((item) =>
            item.id ||
            item.childName ||
            item.interviewDate
          );
      };

      /**
       * HUG画面に表示されている
       * 「全部でxxx件」から件数を取得する。
       */
      const parseTotal = (doc) => {
        const totalText =
          normalizeText(
            Array
              .from(
                doc.querySelectorAll(
                  '.ibox-title.sm h5, .ibox-title h5'
                )
              )
              .map(
                (node) =>
                  node.textContent
              )
              .find(
                (text) =>
                  /全部で\\d+件/.test(
                    text
                  )
              ) ?? ''
          );

        const match =
          totalText.match(
            /全部で(\\d+)件/
          );

        return match
          ? Number(match[1])
          : null;
      };

      /**
       * ページネーションから最大ページ数を取得する。
       */
      const parseMaxPage = (doc) => {
        const pageNumbers =
          Array
            .from(
              doc.querySelectorAll(
                '.pagination a'
              )
            )
            .map((a) => {
              const href =
                a.getAttribute(
                  'href'
                ) ?? '';

              const match =
                href.match(
                  /[?&]page=(\\d+)/
                );

              return match
                ? Number(match[1])
                : null;
            })
            .filter(
              (page) =>
                Number.isFinite(page)
            );

        return Math.max(
          1,
          ...pageNumbers
        );
      };

      /**
       * ----------------------------
       * 1. 初期画面取得
       * ----------------------------
       */
      const initialResponse =
        await fetch(
          request.url,
          {
            method: 'GET',
            credentials: 'include',
            cache: 'no-store',
          }
        );

      if (!initialResponse.ok) {
        throw new Error(
          '各種加算・議事録管理画面を取得できませんでした (HTTP ' +
            initialResponse.status +
            ')'
        );
      }

      const initialHtml =
        await initialResponse.text();

      const initialDoc =
        new DOMParser()
          .parseFromString(
            initialHtml,
            'text/html'
          );

      /**
       * ----------------------------
       * 2. CSRF取得
       * ----------------------------
       */
      const csrfToken =
        String(
          initialDoc
            .querySelector(
              'input[name="csrf_token_from_client"]'
            )
            ?.value ?? ''
        ).trim();

      const modeToken =
        String(
          initialDoc
            .querySelector(
              'input[name="mode_token"]'
            )
            ?.value ??
          'nomode'
        ).trim() ||
        'nomode';

      if (!csrfToken) {
        throw new Error(
          '各種加算・議事録管理画面のCSRFトークンを取得できませんでした。' +
          'HUGのログイン状態を確認してください。'
        );
      }

      /**
       * ----------------------------
       * 3. 施設ID補完
       * ----------------------------
       */
      if (!request.facilityId) {
        const checkedFacility =
          initialDoc.querySelector(
            'input[name^="f_ary["]:checked, ' +
            'input[name^="f_ary["]'
          );

        request.facilityId =
          String(
            checkedFacility?.value ?? ''
          ).trim();
      }

      if (!request.facilityId) {
        throw new Error(
          '一覧取得対象の施設IDを取得できませんでした。'
        );
      }

      /**
       * ----------------------------
       * 4. 年月補完
       * ----------------------------
       */
      if (
        !request.year ||
        !request.month
      ) {
        const currentStartDate =
          String(
            initialDoc
              .querySelector(
                'input[name="interview_date"]'
              )
              ?.value ?? ''
          );

        const match =
          currentStartDate.match(
            /(\\d{4})年(\\d{1,2})月/
          );

        if (match) {
          request.year =
            match[1];

          request.month =
            match[2];
        }
      }

      if (
        !request.year ||
        !request.month
      ) {
        throw new Error(
          '一覧取得対象の年月を取得できませんでした。'
        );
      }

      /**
       * ----------------------------
       * 5. 検索期間生成
       * ----------------------------
       */
      const lastDay =
        getMonthLastDay(
          request.year,
          request.month
        );

      const startDate =
        toJapaneseDate(
          request.year,
          request.month,
          1
        );

      const endDate =
        toJapaneseDate(
          request.year,
          request.month,
          lastDay
        );

      /**
       * ----------------------------
       * 6. 検索POSTデータ生成
       * ----------------------------
       */
      const body =
        new URLSearchParams();

      body.set(
        'mode',
        'search'
      );

      body.set(
        'mode_token',
        modeToken
      );

      body.set(
        'csrf_token_from_client',
        csrfToken
      );

      body.set(
        'f_ary[' +
          request.facilityId +
          ']',
        request.facilityId
      );

      body.set(
        'c_id',
        '0'
      );

      body.set(
        'search',
        ''
      );

      body.set(
        'interview_date',
        startDate
      );

      body.set(
        'interview_date_end',
        endDate
      );

      body.set(
        's_ary[1]',
        '放課後等デイサービス'
      );

      body.set(
        's_ary[2]',
        '児童発達支援'
      );

      // 専門的支援実施加算
      body.set(
        'adding_children_id',
        '55'
      );

      body.set(
        'recorder',
        ''
      );

      /**
       * ----------------------------
       * 7. 検索条件をHUGへPOST
       * ----------------------------
       *
       * このレスポンスを
       * 「1ページ目」とは扱わない。
       *
       * HUG側で現在ページまで
       * セッション保持される可能性があるため。
       */
      const searchResponse =
        await fetch(
          request.url,
          {
            method: 'POST',
            credentials: 'include',
            cache: 'no-store',
            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded;charset=UTF-8',
            },
            body:
              body.toString(),
          }
        );

      if (!searchResponse.ok) {
        throw new Error(
          '専門的支援一覧の検索に失敗しました (HTTP ' +
            searchResponse.status +
            ')'
        );
      }

      const searchHtml =
        await searchResponse.text();

      const searchDoc =
        new DOMParser()
          .parseFromString(
            searchHtml,
            'text/html'
          );

      /**
       * HUG側の検索結果件数
       */
      const total =
        parseTotal(searchDoc);

      /**
       * ページ数
       */
      const maxPage =
        parseMaxPage(searchDoc);

      console.log(
        '[ProfessionalSupportAdditionList] 検索条件設定完了',
        {
          facilityId:
            request.facilityId,
          year:
            request.year,
          month:
            request.month,
          startDate,
          endDate,
          total,
          maxPage,
        }
      );

      /**
       * ----------------------------
       * 8. page=1 ～ 最終ページ取得
       * ----------------------------
       */
      const records = [];

      const pageResults = [];

      for (
        let page = 1;
        page <= maxPage;
        page += 1
      ) {
        const pageUrl =
          request.url +
          '?page=' +
          page;

        const pageResponse =
          await fetch(
            pageUrl,
            {
              method: 'GET',
              credentials:
                'include',
              cache:
                'no-store',
            }
          );

        if (
          !pageResponse.ok
        ) {
          throw new Error(
            '専門的支援一覧の' +
              page +
              'ページ目を取得できませんでした (HTTP ' +
              pageResponse.status +
              ')'
          );
        }

        const pageHtml =
          await pageResponse.text();

        const pageDoc =
          new DOMParser()
            .parseFromString(
              pageHtml,
              'text/html'
            );

        const pageRows =
          parseRows(
            pageDoc
          );

        console.log(
          '[ProfessionalSupportAdditionList] page=' +
            page +
            ' 取得件数:',
          pageRows.length
        );

        pageResults.push({
          page,
          count:
            pageRows.length,
        });

        records.push(
          ...pageRows
        );
      }

      /**
       * ----------------------------
       * 9. 重複排除
       * ----------------------------
       *
       * idが存在する場合は
       * HUG側IDをユニークキーにする。
       *
       * idが取れない場合のみ
       * fallbackキーを使用する。
       */
      const uniqueRecords =
        Array.from(
          new Map(
            records.map(
              (
                record,
                index
              ) => {
                const uniqueKey =
                  record.id
                    ? 'id:' +
                      record.id
                    : [
                        'fallback',
                        record.childName,
                        record.interviewDate,
                        record.facilityName,
                        record.recorderName,
                        record.lastUpdated,
                        index,
                      ].join('|');

                return [
                  uniqueKey,
                  record,
                ];
              }
            )
          ).values()
        );

      const fetchedCount =
        uniqueRecords.length;

      console.log(
        '[ProfessionalSupportAdditionList] 一覧取得結果',
        {
          hugTotal:
            total,
          rawCount:
            records.length,
          fetchedCount,
          pageCount:
            maxPage,
          pageResults,
        }
      );

      /**
       * ----------------------------
       * 10. 件数整合性確認
       * ----------------------------
       *
       * HUG側が表示している件数と
       * Electron側の実取得件数が違えば、
       * 保存処理へ進ませない。
       */
      if (
        Number.isFinite(total) &&
        total !== fetchedCount
      ) {
        console.error(
          '[ProfessionalSupportAdditionList] 件数不一致',
          {
            hugTotal:
              total,
            fetchedCount,
            rawCount:
              records.length,
            pageCount:
              maxPage,
            pageResults,
          }
        );

        throw new Error(
          '専門的支援一覧の取得件数が一致しません。' +
          ' HUG=' +
          total +
          '件 / 取得=' +
          fetchedCount +
          '件'
        );
      }

      /**
       * ----------------------------
       * 11. 結果返却
       * ----------------------------
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

        /**
         * HUG画面に表示された
         * 本来の総件数
         */
        total:
          Number.isFinite(total)
            ? total
            : fetchedCount,

        /**
         * Electronが実際に
         * 一意に取得できた件数
         */
        fetchedCount,

        /**
         * 重複排除前の取得件数
         */
        rawCount:
          records.length,

        pageCount:
          maxPage,

        /**
         * デバッグ用
         * 各ページごとの取得件数
         */
        pageResults,

        records:
          uniqueRecords,
      };
    })()
  `
}