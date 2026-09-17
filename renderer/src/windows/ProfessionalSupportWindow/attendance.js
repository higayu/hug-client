import { URL_TARGET1 } from './constants'

export const normalizeDate = (value) => {
  const matched = String(value ?? '').match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/)
  if (!matched) return ''

  return `${matched[1]}-${matched[2].padStart(2, '0')}-${matched[3].padStart(2, '0')}`
}

export const getWindowParameters = () => {
  const params = new URLSearchParams(window.location.search)

  const targetDate = normalizeDate(
    params.get('DATE_STR') ??
      params.get('targetDate') ??
      params.get('date') ??
      params.get('CURRENT_YMD'),
  )

  let facilities = []

  const facilitiesJson = params.get('FACILITIES_JSON')

  if (facilitiesJson) {
    try {
      const parsedFacilities = JSON.parse(facilitiesJson)

      if (Array.isArray(parsedFacilities)) {
        facilities = parsedFacilities
          .filter(
            (facility) =>
              facility &&
              facility.id !== undefined &&
              facility.id !== null,
          )
          .map((facility) => ({
            id: facility.id,
            name: facility.name || `施設ID: ${facility.id}`,
            url: facility.url || '',
          }))
      }
    } catch (error) {
      console.error(
        '[ProfessionalSupportWindow] FACILITIES_JSON の解析に失敗:',
        error,
      )
    }
  }

  const facilityId =
    params.get('FACILITY_ID') ??
    params.get('facilityId') ??
    params.get('facility') ??
    params.get('f_id') ??
    ''

  const facilityName =
    params.get('FACILITY_NAME') ??
    params.get('facilityName') ??
    params.get('facility_name') ??
    ''

  if (
    facilityId &&
    !facilities.some(
      (facility) => String(facility.id) === String(facilityId),
    )
  ) {
    facilities.unshift({
      id: facilityId,
      name: facilityName || `施設ID: ${facilityId}`,
      url: params.get('FACILITY_URL') ?? '',
    })
  }

  return {
    facilityId: String(facilityId),
    facilityName,
    facilities,
    targetDate,
  }
}

/**
 * HUGのログイン済みWebViewセッション上で attendance.php を取得する。
 *
 * facilityId がProfessionalSupportWindowのURLに無い場合は、
 * attendance.phpをGETし、レスポンスHTMLのフォームから現在選択中の施設IDを解決する。
 * 年月も同様に、targetDateが無い場合だけフォーム値から補完する。
 *
 * 右側WebViewの「表示中DOM」は出席データ取得元として使用しない。
 * GET/POSTレスポンスHTMLをDOMParserで解析する。
 */
export const buildAttendanceFetchScript = ({ facilityId, targetDate }) => {
  const [year = '', month = ''] = targetDate
    ? targetDate.split('-').map(Number)
    : []

  const request = {
    url: URL_TARGET1,
    facilityId: String(facilityId ?? ''),
    year: String(year || ''),
    month: String(month || ''),
  }

  return `
    (async () => {
      const request = ${JSON.stringify(request)};

      const readControlValue = (doc, names) => {
        for (const name of names) {
          const control = doc.querySelector(
            'select[name="' + name + '"], input[name="' + name + '"]'
          );

          if (control && String(control.value ?? '').trim()) {
            return String(control.value).trim();
          }
        }

        return '';
      };

      // ProfessionalSupportWindowのURLに施設ID/年月が渡されていない場合のみ、
      // 同じログインセッションでattendance.phpをGETし、フォームの現在値を補完する。
      if (!request.facilityId || !request.year || !request.month) {
        const initialResponse = await fetch(request.url, {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        });

        if (!initialResponse.ok) {
          throw new Error(
            '出席画面の初期情報を取得できませんでした (HTTP ' +
              initialResponse.status +
              ')'
          );
        }

        const initialHtml = await initialResponse.text();
        const initialDoc = new DOMParser().parseFromString(initialHtml, 'text/html');

        if (!request.facilityId) {
          request.facilityId = readControlValue(initialDoc, [
            'facility',
            'facility_id',
            'f_id',
          ]);
        }

        if (!request.year) {
          request.year = readControlValue(initialDoc, [
            's_year',
            'year',
          ]);
        }

        if (!request.month) {
          request.month = readControlValue(initialDoc, [
            's_month',
            'month',
          ]);
        }
      }

      if (!request.facilityId) {
        throw new Error(
          'attendance.phpのフォームから施設IDを取得できませんでした。'
        );
      }

      if (!request.year || !request.month) {
        throw new Error(
          'attendance.phpのフォームから対象年月を取得できませんでした。'
        );
      }

      const body = new URLSearchParams({
        mode: 'search',
        facility: request.facilityId,
        s_year: request.year,
        s_month: request.month,
        visible: '1',
        use_services: '1',
        services_sort: '1',
        rank_disp: '1',
        asc_desc: '1',
        visible_event: '0',
        visible_staff: '0',
      });

      const response = await fetch(request.url, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error(
          '出席データの取得に失敗しました (HTTP ' +
            response.status +
            ')'
        );
      }

      const html = await response.text();
      const documentData = new DOMParser().parseFromString(html, 'text/html');

      const heading =
        documentData.querySelector('.ibox-title h3')
          ?.textContent
          ?.trim() ?? '';

      const calendar = documentData.querySelector('.calendar');

      if (!calendar) {
        const title = documentData.querySelector('title')?.textContent?.trim() ?? '';

        throw new Error(
          title
            ? '出席カレンダーを取得できませんでした。HUGのログイン状態を確認してください。 (' + title + ')'
            : '出席カレンダーを取得できませんでした。HUGのログイン状態を確認してください。'
        );
      }

      const days = Array.from(
        calendar.querySelectorAll('td[id^="td_"]'),
      )
        .map((cell) => {
          const date = cell.id.replace(/^td_/, '');

          if (!/^\\d{4}-\\d{2}-\\d{2}$/.test(date)) {
            return null;
          }

          const sections = Array.from(
            cell.querySelectorAll('.calendar-data dt'),
          ).reduce((result, titleElement) => {
            const type =
              titleElement.querySelector('span')
                ?.textContent
                ?.trim() ?? '';

            const childItems = Array.from(
              titleElement.nextElementSibling
                ?.querySelectorAll('li') ?? [],
            );

            const names = childItems
              .map((item) =>
                item.textContent
                  .replace(/\\s+/g, ' ')
                  .trim(),
              )
              .filter(Boolean);

            // .calendar-pickup が付いている児童は、当日未入室または未来日の予定。
            // 表示には残し、DB同期用データからだけ除外する。
            const syncNames = childItems
              .filter((item) => !item.querySelector('.calendar-pickup'))
              .map((item) =>
                item.textContent
                  .replace(/\\s+/g, ' ')
                  .trim(),
              )
              .filter(Boolean);

            const countText =
              titleElement.querySelector('b')
                ?.textContent
                ?.trim();

            const count = countText
              ? Number(countText)
              : names.length;

            result[type] = {
              count,
              names,
              syncNames,
            };

            return result;
          }, {});

          const attendance =
            sections['出席'] ?? {
              count: 0,
              names: [],
              syncNames: [],
            };

          const absence =
            sections['欠席'] ?? {
              count: 0,
              names: [],
              syncNames: [],
            };

          const absenceWithoutAddition =
            sections['欠席（加算なし）'] ?? {
              count: 0,
              names: [],
              syncNames: [],
            };

          return {
            date,
            attendanceCount: attendance.count,
            attendanceNames: attendance.names,
            attendanceSyncNames: attendance.syncNames,
            absenceCount: absence.count,
            absenceNames: absence.names,
            absenceSyncNames: absence.syncNames,
            absenceWithoutAdditionCount:
              absenceWithoutAddition.count,
            absenceWithoutAdditionNames:
              absenceWithoutAddition.names,
            absenceWithoutAdditionSyncNames:
              absenceWithoutAddition.syncNames,
          };
        })
        .filter(Boolean);

      return {
        heading,
        days,
        facilityId: request.facilityId,
        year: Number(request.year),
        month: Number(request.month),
      };
    })()
  `
}
